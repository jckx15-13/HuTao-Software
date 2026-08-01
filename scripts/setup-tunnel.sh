#!/usr/bin/env bash
#
# VS Code Remote Tunnel helper for silver-wolf-vi.
#
# Motivation: the usual "install a tunnel" instructions tell you to curl the
# standalone `cli-alpine-x64` tarball. That is only correct when VS Code is not
# installed. This machine already has the full `code` CLI at /usr/bin/code, and
# that binary ships the same tunnel implementation, so downloading a second
# copy just gives you two CLIs with two separate credential stores. This script
# prefers whatever `code` is on PATH and only falls back to the tarball if none
# is found.
#
# Nothing here is destructive and nothing needs sudo: the tunnel service is a
# systemd --user unit, so it installs into your own session.
#
# Usage:
#   ./scripts/setup-tunnel.sh login   [name]   # one-time GitHub auth
#   ./scripts/setup-tunnel.sh start   [name]   # run tunnel in the foreground
#   ./scripts/setup-tunnel.sh service [name]   # install as a --user service
#   ./scripts/setup-tunnel.sh status           # show auth + tunnel state
#   ./scripts/setup-tunnel.sh stop             # stop the running tunnel
#
# [name] defaults to a sanitized form of this machine's hostname.
#
set -euo pipefail

# Repo root, regardless of where the script is invoked from.
REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

# Fallback install location, only used when no `code` is on PATH.
CLI_DIR="$REPO_ROOT/.vscode-cli"
CLI_URL="https://update.code.visualstudio.com/latest/cli-alpine-x64/stable"

# This project's dev ports, echoed as guidance after the tunnel starts.
VITE_PORT=3005
BRIDGE_PORT=8001

# --- tunnel name ----------------------------------------------------------
# The port-forwarding service only accepts lowercase alphanumerics and
# hyphens, 4-20 characters. Hostnames like "JCKX15-SILVERWOLF" need folding.
# Note: `hostname` is not installed on this box, so read the name from
# `uname -n` and fall back to /etc/hostname.
sanitize_name() {
    local raw="$1" out
    out="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9-' '-')"
    # Collapse runs of hyphens, then trim leading/trailing ones.
    while [[ "$out" == *--* ]]; do out="${out//--/-}"; done
    out="${out#-}"
    out="${out%-}"
    out="${out:0:20}"
    out="${out%-}"
    printf '%s' "$out"
}

default_name() {
    local raw
    raw="$(uname -n 2>/dev/null || true)"
    [[ -n "$raw" ]] || raw="$(cat /etc/hostname 2>/dev/null || true)"
    [[ -n "$raw" ]] || raw="silver-wolf-vi"
    local name
    name="$(sanitize_name "$raw")"
    # The service rejects very short names; pad rather than fail late.
    if (( ${#name} < 4 )); then
        name="$(sanitize_name "silver-wolf-${name}")"
    fi
    printf '%s' "$name"
}

# --- CLI resolution -------------------------------------------------------
# Prefer an installed `code`. Only download the standalone CLI if there is
# genuinely nothing to use.
CODE_BIN=""

resolve_code() {
    if command -v code >/dev/null 2>&1; then
        CODE_BIN="$(command -v code)"
        return 0
    fi
    if [[ -x "$CLI_DIR/code" ]]; then
        CODE_BIN="$CLI_DIR/code"
        return 0
    fi
    return 1
}

fetch_standalone_cli() {
    echo "No 'code' CLI found on PATH."
    echo "Falling back to the standalone VS Code CLI (static musl build)."
    echo "  source: $CLI_URL"
    echo "  target: $CLI_DIR/code"
    echo
    read -r -p "Download it? [y/N] " reply
    [[ "$reply" =~ ^[Yy]$ ]] || { echo "Aborted; nothing downloaded." >&2; exit 1; }

    command -v curl >/dev/null 2>&1 || { echo "error: curl is required for the fallback download." >&2; exit 1; }
    command -v tar  >/dev/null 2>&1 || { echo "error: tar is required for the fallback download." >&2; exit 1; }

    mkdir -p "$CLI_DIR"
    curl -fsSL "$CLI_URL" -o "$CLI_DIR/vscode-cli.tar.gz"
    tar -xzf "$CLI_DIR/vscode-cli.tar.gz" -C "$CLI_DIR"
    rm -f "$CLI_DIR/vscode-cli.tar.gz"
    chmod +x "$CLI_DIR/code"
    CODE_BIN="$CLI_DIR/code"

    echo "Installed to $CODE_BIN"
    echo "Tip: add .vscode-cli/ to .gitignore so it stays out of the repo."
}

require_code() {
    if ! resolve_code; then
        fetch_standalone_cli
    fi
}

# --- subcommands ----------------------------------------------------------

cmd_login() {
    echo "Authenticating the tunnel CLI against GitHub."
    echo "A device code will be printed; open the URL and enter it in a browser."
    echo
    "$CODE_BIN" tunnel user login --provider github
    echo
    echo "Logged in. Next: ./scripts/setup-tunnel.sh start"
}

print_access_guidance() {
    local name="$1"
    cat <<EOF

------------------------------------------------------------------
Tunnel name: $name

Open from any other device (sign in with the SAME GitHub account):

  https://vscode.dev/tunnel/$name

Then File > Open Folder and pick:

  $REPO_ROOT

Dev servers, once you run them inside that remote window:
  npm run dev             -> Vite on $VITE_PORT
  python bridge/server.py -> bridge on $BRIDGE_PORT

VS Code auto-forwards ports it detects. If one does not appear, add it
by hand in the PORTS panel (see docs/REMOTE_DEV.md).
------------------------------------------------------------------

EOF
}

cmd_start() {
    local name="$1"
    echo "Starting tunnel '$name' in the foreground (Ctrl-C to stop)."
    print_access_guidance "$name"
    "$CODE_BIN" tunnel --accept-server-license-terms --name "$name"
}

cmd_service() {
    local name="$1"
    # `service install` registers a systemd --user unit. No root required, and
    # it does not survive logout unless lingering is enabled (see the doc).
    echo "Installing the tunnel as a systemd --user service (no sudo needed)."
    "$CODE_BIN" tunnel service install --accept-server-license-terms --name "$name"
    print_access_guidance "$name"
    echo "Manage it with:"
    echo "  systemctl --user status code-tunnel"
    echo "  $CODE_BIN tunnel service log"
    echo "  $CODE_BIN tunnel service uninstall"
}

cmd_status() {
    echo "CLI:  $CODE_BIN"
    echo -n "Version: "
    "$CODE_BIN" --version 2>/dev/null | head -1 || echo "unknown"
    echo
    echo "Account:"
    "$CODE_BIN" tunnel user show 2>&1 | sed 's/^/  /' || true
    echo
    echo "Tunnel:"
    "$CODE_BIN" tunnel status 2>&1 | sed 's/^/  /' || true
    echo
    echo "systemd --user unit:"
    if command -v systemctl >/dev/null 2>&1; then
        systemctl --user is-active code-tunnel 2>&1 | sed 's/^/  /' || true
    else
        echo "  systemctl not available"
    fi
    echo
    echo "Default tunnel name for this machine: $(default_name)"
}

cmd_stop() {
    # Stops a running tunnel. This does NOT unregister the machine and does
    # NOT uninstall the service; both are separate, deliberate steps.
    echo "Stopping any running tunnel on this machine."
    "$CODE_BIN" tunnel kill || true
    echo
    echo "Done. The machine is still registered with the forwarding service."
    echo "To fully detach it, see docs/REMOTE_DEV.md (revoking access)."
}

usage() {
    cat <<EOF
VS Code Remote Tunnel helper for silver-wolf-vi.

Usage: ${0##*/} <command> [tunnel-name]

Commands:
  login     Authenticate the tunnel CLI with GitHub (one time, interactive)
  start     Run the tunnel in the foreground
  service   Install the tunnel as a systemd --user service (no sudo)
  status    Show CLI, account, tunnel, and service state
  stop      Stop a running tunnel (does not unregister or uninstall)
  help      This message

Tunnel name defaults to a sanitized hostname: $(default_name)

Reach the tunnel from another device at:
  https://vscode.dev/tunnel/<name>

Full guide: docs/REMOTE_DEV.md
EOF
}

# --- dispatch -------------------------------------------------------------

main() {
    local cmd="${1:-help}"

    case "$cmd" in
        help|-h|--help|"")
            usage
            exit 0
            ;;
    esac

    require_code

    # An explicitly supplied name goes through the same folding as the
    # hostname default, so an invalid name fails here with a clear message
    # rather than deep inside the forwarding service.
    local name
    if [[ -n "${2:-}" ]]; then
        name="$(sanitize_name "$2")"
        if [[ "$name" != "$2" ]]; then
            echo "note: tunnel name '$2' folded to '$name'" >&2
            echo "      (service allows lowercase letters, digits and hyphens, max 20)" >&2
        fi
        if (( ${#name} < 4 )); then
            echo "error: tunnel name '$name' is too short (need at least 4 characters)." >&2
            exit 1
        fi
    else
        name="$(default_name)"
    fi

    case "$cmd" in
        login)   cmd_login ;;
        start)   cmd_start "$name" ;;
        service) cmd_service "$name" ;;
        status)  cmd_status ;;
        stop)    cmd_stop ;;
        *)
            echo "error: unknown command '$cmd'" >&2
            echo >&2
            usage >&2
            exit 1
            ;;
    esac
}

main "$@"
