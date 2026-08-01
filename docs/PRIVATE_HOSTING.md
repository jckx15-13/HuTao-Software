# Private hosting

Goal: a hosted URL that only you can reach, where an outsider cannot extract
a key even with the full source in front of them.

## Why not GitHub Pages

Two hard constraints, neither of which is a configuration problem:

1. **GitHub Pages is public on Free/Pro/Team.** Access-controlled Pages is a
   GitHub Enterprise Cloud feature. There is no setting that makes a Pages
   site private on other plans.
2. **A static site cannot hold a secret.** Everything shipped to the browser
   is readable. Vite inlines `VITE_*` variables into the bundle as plain
   text at build time. Minification and obfuscation are not security — they
   raise effort, not impossibility.

A password check written in client-side JavaScript runs on the visitor's own
machine, so they delete the check. This is structural, not a matter of
implementing the gate more carefully.

The conclusion: the gate has to sit **in front of** the site, on
infrastructure the visitor does not control.

## Cloudflare Pages + Access

Cloudflare Access authenticates at the edge. An unauthenticated request is
challenged *before* any of the bundle is served, so there is no source to
inspect and no key to find. Free tier covers up to 50 users.

The workflow `.github/workflows/deploy-cloudflare.yml` publishes the same
`dist/` build. The app needs no changes.

### 1. Create the Pages project

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages**. The
project name must match the workflow: `silver-wolf-vi`.

### 2. Add the two GitHub secrets

Repo → **Settings → Secrets and variables → Actions → New repository
secret**:

| Secret | Where it comes from |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template (or a custom token with `Account : Cloudflare Pages : Edit`) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard sidebar, or the URL: `dash.cloudflare.com/<account-id>` |

Scope the token to Pages only. It never reaches the browser — it is used on
the Actions runner at deploy time.

### 3. Lock it down with Access

Cloudflare **Zero Trust** dashboard → **Access → Applications → Add an
application → Self-hosted**:

- **Application domain**: your `*.pages.dev` hostname (or a custom domain).
- **Policy name**: `owner-only`
- **Action**: `Allow`
- **Include** → **Emails** → your address.

Everything not matching is denied by default. Add a login method under
**Settings → Authentication** — **One-time PIN** needs no setup and emails
you a code; GitHub OAuth is also available.

### 4. Verify it actually locks

Do not skip this. Open the `*.pages.dev` URL in a **private window**:

- You should get a Cloudflare login challenge, not the app.
- View source on the challenge page — no application bundle, no keys.
- Log in with your address; the app loads.

If the app renders in a private window without a challenge, the policy is not
attached to the right hostname. Fix that before treating it as private.

## Note on the bridge

The bridge (`127.0.0.1:8001`) is local-only and will not exist on any hosted
deployment. The app degrades to its offline path — see `isBridgeEnabled()` in
`src/lib/bridgeConfig.ts`. Hosted builds are a viewer for the globe and UI,
not a route to your local LLM.

For real remote access to the *full* stack, including local models, use the
VS Code tunnel instead — see [REMOTE_DEV.md](REMOTE_DEV.md).

## Third-party traffic

The app connects to `wss://dataenginev2.worldwideview.dev/stream`. Behind
Access only you reach the site, so that traffic stays as it is in local dev.
On a genuinely public deployment it would originate from every visitor.

## Comparison

| Approach | Actually private | Cost | Notes |
|---|---|---|---|
| Cloudflare Pages + Access | Yes — edge auth | Free | Recommended for a hosted URL |
| VS Code tunnel | Yes — GitHub account | Free | Already running; full stack incl. bridge |
| GitHub Pages + client-side gate | **No** | Free | Security theater; do not use |
| GitHub Enterprise Cloud Pages | Yes | ~$21/user/mo | Overkill for one user |
