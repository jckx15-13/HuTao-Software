# Remote development over VS Code tunnels

Work on this checkout from another machine — a laptop, a tablet, anything with
a browser — without exposing a port to the internet yourself or setting up a
VPN. The dev machine dials out to Microsoft's forwarding service and your
remote device connects through it.

`scripts/setup-tunnel.sh` wraps the flow.

## Prerequisites

- **VS Code CLI.** Already present here as `/usr/bin/code` (v1.106.3). The
  full VS Code install ships the same tunnel implementation as the standalone
  CLI, so the script uses it directly. It only downloads the standalone
  `cli-alpine-x64` build if no `code` exists on PATH — and it asks first.
- **A GitHub account.** Used for authentication, on both ends. The same
  account must sign in on the remote device.
- **No sudo.** The tunnel service is a systemd `--user` unit.

## Setup

```bash
# 1. One-time GitHub auth. Prints a device code to paste into a browser.
./scripts/setup-tunnel.sh login

# 2. Run the tunnel in the foreground (Ctrl-C stops it).
./scripts/setup-tunnel.sh start

# ...or install it as a background --user service that survives reboot.
./scripts/setup-tunnel.sh service
```

Check state at any time — this is read-only:

```bash
./scripts/setup-tunnel.sh status
```

```
CLI:  /usr/bin/code
Version: 1.106.3

Account:
  not logged in

Tunnel:
  {"tunnel":null,"service_installed":false}
```

Stop a running tunnel without unregistering the machine:

```bash
./scripts/setup-tunnel.sh stop
```

### Tunnel name

Every command takes an optional name; it defaults to a sanitized hostname,
which on this machine is **`jckx15-silverwolf`**. The forwarding service only
accepts lowercase letters, digits and hyphens, 4-20 characters, so the script
folds whatever you give it and tells you when it did:

```bash
$ ./scripts/setup-tunnel.sh start "My Laptop!!"
note: tunnel name 'My Laptop!!' folded to 'my-laptop'
```

### `service` and logout

A `--user` service stops when your last session ends. To keep the tunnel up
after you log out of the dev machine:

```bash
loginctl enable-linger "$USER"
```

Manage the unit with `systemctl --user status code-tunnel`, or
`code tunnel service log` / `code tunnel service uninstall`.

## Connecting from another device

Open, signed in as the **same GitHub account**:

```
https://vscode.dev/tunnel/jckx15-silverwolf
```

Then **File > Open Folder** and choose:

```
/home/admin/Documents/silver-wolf-vi/silver-wolf-vi
```

You can also connect from desktop VS Code: install the *Remote - Tunnels*
extension and run **Remote-Tunnels: Connect to Tunnel**. Which client you use
changes how ports behave — see below.

## Forwarding the dev ports

This project runs two servers:

| Port | Service | Started with |
|---|---|---|
| 3005 | Vite dev server | `npm run dev` |
| 8001 | Odysseus bridge | `cd bridge && ./venv/bin/python3 server.py` |

Both already bind `0.0.0.0`, so VS Code can see them. Start them from a
terminal **inside the remote window**; VS Code usually auto-detects the ports
and lists them in the **PORTS** panel. If one is missing, click *Forward a
Port* and enter the number.

How you reach them depends on the client, and this trips people up:

**Desktop VS Code connected to the tunnel.** Forwarded ports are mapped to
real `localhost` on your client machine. `http://localhost:3005` works, and
the app's default bridge URL of `http://127.0.0.1:8001` resolves correctly
with no configuration. Nothing to change.

**vscode.dev in a browser.** There is no client-side `localhost` to bind, so
each forwarded port gets its own URL of the form
`https://<name>-<port>.<region>.devtunnels.ms`. Opening the 3005 URL loads the
app, but the app still tries to call `http://127.0.0.1:8001` — which in a
remote browser means *that device*, not the dev machine — so bridge chat falls
back to the local diagnostic assistant. Point it at the forwarded bridge
instead, either by setting the URL before starting Vite:

```bash
VITE_BRIDGE_URL="https://jckx15-silverwolf-8001.euw.devtunnels.ms" npm run dev
```

or at runtime via **Settings > Developer Settings > endpoint override**, which
avoids a restart.

Forwarded ports default to **Private** visibility — anyone loading the URL
must authenticate as you. Switching a port to *Public* in the PORTS panel
removes that check and makes it reachable by anyone with the link. Prefer
Private.

## Security

**A tunnel grants full access to this machine, as your user account, to anyone
who can sign in to the linked GitHub account.** That is not limited to this
repository: it includes a terminal, the whole filesystem your user can read,
and any credentials in it — `.env.local`, SSH keys, shell history. Treat it as
equivalent to handing out SSH access.

Practical consequences:

- Protect the GitHub account with 2FA. It is the only thing standing between
  the internet and a shell on this box.
- Do not leave the service installed on a shared or untrusted machine.
- Prefer `start` over `service` for occasional use — a foreground tunnel dies
  with the terminal, so there is nothing to forget about.
- Keep forwarded ports Private.

### Revoking access

Stopping the tunnel is not the same as revoking it. To fully detach:

```bash
./scripts/setup-tunnel.sh stop      # stop the running tunnel
code tunnel service uninstall       # if installed as a service
code tunnel unregister              # drop this machine's registration
code tunnel user logout             # clear stored credentials
```

Then revoke the token on GitHub's side, which is the part people skip:

**https://github.com/settings/applications** > *Authorized OAuth Apps* >
**Visual Studio Code** > *Revoke*.

Until you do that, the stored grant remains valid and the machine can be
re-registered without a fresh login prompt.

## Related

- [LOCAL_LLM.md](LOCAL_LLM.md) — running the bridge against a local model, so
  a remote session needs no cloud API keys.
- [../AGENTS.md](../AGENTS.md) — bridge and venv layout.
