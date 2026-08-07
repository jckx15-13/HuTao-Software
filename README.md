

# Silver Wolf VI

An adaptive cyberpunk chat and astronomy workspace with a local diagnostic AI path, Gemini responses when configured, an optional Odysseus bridge, local chat history, ArcGIS/OSM globe imagery, Keplerian planet targeting, simulated telemetry, wallpaper-based theme extraction, and configurable interface controls.



## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Optional: set provider keys in [.env.local](.env.local), or use Settings -> AI Configuration -> API and connector credential engine for local browser testing and setup handoff.
3. The credential engine registers OpenAI, Gemini, Anthropic, OpenRouter, Mistral, Perplexity, Groq, Apify, Google Cloud, GitHub, Notion, OpenWeather, and the local Bridge endpoint. Browser storage is local-development only; production secrets should live behind the Bridge or another backend. Weather overlays now require an OpenWeather key from the credential engine or `VITE_OPENWEATHER_API_KEY`; no demo key is embedded in service code.
4. The connector engine maps those providers to request descriptors, probe URLs, capability tags, and browser-vs-backend routing metadata. This keeps AI routes, Apify actors, Google Cloud/Maps, GitHub, Notion, OpenWeather, and the local Bridge on one provider model instead of scattered per-feature API code.
5. Optional: run the Odysseus bridge on `http://127.0.0.1:8001` to enable bridge-backed chat. Set `VITE_BRIDGE_URL`, the Developer Settings endpoint override, or the credential-engine Bridge URL if your bridge runs elsewhere. Without it, the app falls back to the local diagnostic assistant.
6. To make Bridge chat use a real server-side model endpoint, set a provider key and model pair in the Bridge environment, for example `OPENAI_API_KEY` plus `OPENAI_MODEL`, or `OPENROUTER_API_KEY` plus `OPENROUTER_MODEL`. Supported OpenAI-compatible Bridge provider pairs are OpenAI, OpenRouter, Mistral, Perplexity, and Groq. Bridge also exposes redacted connector status for `APIFY_TOKEN`, `GOOGLE_MAPS_API_KEY`, `GITHUB_TOKEN`, `NOTION_API_KEY`, `OPENWEATHER_API_KEY`, and server-side AI keys through `/api/credentials/providers` and `/api/connectors/providers`; add `?probe=true` or call `/api/connectors/probe/{provider_id}` to actively check configured provider credentials without returning secret values.
7. ChatGPT/GPT models are not activated by a ChatGPT Pro subscription alone; they require OpenAI API access through a server-side bridge that secures your API key. The browser settings page can stage a key locally for setup handoff, but the frontend intentionally does not send OpenAI keys directly from the browser.
8. Run the app:
   `npm run dev`
9. Verify the app:
   `npm run lint`, `npm test`, and `npm run build`

## Integration Status

This repository is the active root runtime. It integrates:
- **Silver Wolf VI:** the Vite/React/Cesium app, chat shell, settings, telemetry, and astronomy views.
- **WorldwideView:** an optional ignored sub-project for advanced geospatial work. The root app includes Cesium and telescope/WWT-style runtime paths, but the `worldwideview/` dev stack still has its own install and database requirements.
- **Odysseus bridge:** optional local chat bridge, defaulting to `http://127.0.0.1:8001` and configurable through `VITE_BRIDGE_URL` or Developer Settings. The bridge now skips stale Odysseus sessions and degrades to a local diagnostic AI response when the bridge is offline or no Odysseus/server-side provider model endpoint is configured.

Integration should be treated as evidence-backed and conditional, not 100%. Local AI fallback, imagery defaults, astronomy math, the credential engine, connector engine, Bridge server-provider discovery, temporary server-provider mock routing, bridge health, Odysseus health, ChromaDB vector memory, Browser MCP registration, UI verification, active redacted connector probes, and mock/local-fallback proxy chat are covered by local checks. A real Odysseus or server-side provider model endpoint is not configured in this checkout unless matching provider key/model environment variables are supplied, and the ignored `worldwideview/` stack still requires its own runtime setup.
The Bridge exposes `/api/integration/status` as the runtime feature reality ledger. It reports Silver Wolf VI, WorldWideView, and Odysseus repository evidence; feature states such as `verified`, `source-backed`, `unconfigured`, or `missing`; an integration score that is intentionally below 100 while live external credentials are absent; and a `not_100_reason`.
`npm test` includes an integration contract check that verifies the mapped WorldwideView assets, Odysseus assets/source modules, credential-engine contracts, connector-engine contracts, server-provider bridge/verifier contracts, redacted Bridge connector-provider/probe contracts, feature-reality ledger contracts, and local bridge routes still exist.

**Developer Note:** 
- **Installation:** Run `cd worldwideview && pnpm install` to set up the geospatial engine dependencies.
- **Database:** Local development in the `worldwideview` directory requires **Docker Desktop** to be running for the database services.
- **Odysseus vector memory:** Run `cd odysseus && docker compose up -d chromadb` before starting the bridge when you want ChromaDB-backed RAG and memory vectors.
- **Environment:** If you prefer using an external database, you can set the `DATABASE_URL` in `worldwideview/.env`.
- **Ignore Path:** The `worldwideview/` directory is ignored by the root Git repository to avoid path length issues and recursive tracking conflicts on Windows.
- **Git Config:** If you encounter path length warnings on Windows, run `git config core.longpaths true` in your terminal.

## Project Notes

- Architecture, critique, and design notes live in [DOCS.md](DOCS.md).
- The main app code is split across `src/components`, `src/hooks`, `src/lib`, and `src/store`.
- Build verification: `npm run lint`, `npm test`, and `npm run build`.
