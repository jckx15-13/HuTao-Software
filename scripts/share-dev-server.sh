#!/usr/bin/env bash
# Share the local dev server over a public Cloudflare quick tunnel, so the app
# can be opened in a real browser on another device (Claude in Chrome, a phone,
# a tablet) without VPN or port-forwarding setup.
#
#   ./scripts/share-dev-server.sh            # start Vite + bridge + tunnel
#   ./scripts/share-dev-server.sh --url      # print the current tunnel URL only
#   ./scripts/share-dev-server.sh --stop     # tear everything down
#
# SECURITY: a quick tunnel is PUBLIC — anyone with the URL reaches this dev
# server, and through it the bridge's local routes. It is unauthenticated. Use
# it for short sharing sessions and run --stop when done.
#
# For a PRIVATE, authenticated alternative — and for full remote development
# rather than just viewing the app — use scripts/setup-tunnel.sh (VS Code
# Remote Tunnels) instead; see docs/REMOTE_DEV.md.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${TMPDIR:-/tmp}/silver-wolf-share"
CF_BIN="$RUN_DIR/cloudflared"
CF_LOG="$RUN_DIR/cloudflared.log"
BRIDGE_LOG="$RUN_DIR/bridge.log"
VITE_LOG="$RUN_DIR/vite.log"
VITE_PORT=3005
BRIDGE_PORT=8001

mkdir -p "$RUN_DIR"

url_from_log() {
  [ -f "$CF_LOG" ] && grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$CF_LOG" | head -1 || true
}

case "${1:-}" in
  --url)
    url="$(url_from_log)"
    if [ -n "$url" ]; then echo "$url"; else echo "no tunnel running" >&2; exit 1; fi
    exit 0
    ;;
  --stop)
    pkill -f "cloudflared tunnel --url" 2>/dev/null || true
    pkill -f "bridge/server.py" 2>/dev/null || true
    pkill -f "vite.*--port=$VITE_PORT" 2>/dev/null || true
    echo "stopped tunnel, bridge, and vite"
    exit 0
    ;;
esac

# 1. Vite dev server. .env.local supplies VITE_DEV_ALLOWED_HOSTS so Vite accepts
#    the tunnel's Host header; without it Vite returns "Blocked request".
if curl -sf -o /dev/null -m 2 "http://localhost:$VITE_PORT"; then
  echo "vite      already running on $VITE_PORT"
else
  # DISABLE_HMR: Vite's HMR websocket assumes it can reach the dev server on the
  # same host:port as the page. Through a tunnel it cannot (wss on 443 vs local
  # 3005), so the client logs repeated "failed to connect to websocket" errors.
  # Live-reload is not useful for a share session anyway, so turn it off.
  ( cd "$REPO_ROOT" && DISABLE_HMR=true nohup npm run dev >"$VITE_LOG" 2>&1 </dev/null & )
  echo "vite      starting on $VITE_PORT (HMR off for tunnel use)"
fi

# 2. Bridge (optional; the app degrades to its local assistant without it).
if curl -sf -o /dev/null -m 2 "http://127.0.0.1:$BRIDGE_PORT/status"; then
  echo "bridge    already running on $BRIDGE_PORT"
elif [ -x "$REPO_ROOT/bridge/venv/bin/python3" ]; then
  ( cd "$REPO_ROOT/bridge" && nohup ./venv/bin/python3 server.py >"$BRIDGE_LOG" 2>&1 </dev/null & )
  echo "bridge    starting on $BRIDGE_PORT"
else
  echo "bridge    skipped (no venv; see AGENTS.md)"
fi

# 3. cloudflared, cached across runs so repeat starts are fast.
if [ ! -x "$CF_BIN" ]; then
  echo "cloudflared  downloading (one time)..."
  curl -sL -o "$CF_BIN" \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
  chmod +x "$CF_BIN"
fi

pkill -f "cloudflared tunnel --url" 2>/dev/null || true
: > "$CF_LOG"
nohup "$CF_BIN" tunnel --url "http://localhost:$VITE_PORT" >"$CF_LOG" 2>&1 </dev/null &

printf 'tunnel    waiting for URL'
for _ in $(seq 1 30); do
  url="$(url_from_log)"
  [ -n "$url" ] && break
  printf '.'
  sleep 1
done
echo

url="$(url_from_log)"
if [ -z "$url" ]; then
  echo "tunnel failed to start; see $CF_LOG" >&2
  exit 1
fi

cat <<EOF

  Open this in any browser:

      $url

  This URL is PUBLIC and unauthenticated. Run with --stop when finished.

EOF
