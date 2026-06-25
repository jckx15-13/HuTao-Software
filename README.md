

# Silver Wolf VI

An adaptive cyberpunk chat and astronomy workspace with a local diagnostic AI path, Gemini responses when configured, an optional Odysseus bridge, local chat history, ArcGIS/OSM globe imagery, Keplerian planet targeting, simulated telemetry, wallpaper-based theme extraction, and configurable interface controls.

View your app in AI Studio: https://ai.studio/apps/d14a70cc-0c1f-444d-86d9-625b54096fee

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Optional: set provider keys in [.env.local](.env.local), or use Settings -> AI Configuration -> API and connector credential engine for local browser testing and setup handoff.
3. The credential engine registers OpenAI, Gemini, Anthropic, OpenRouter, Mistral, Perplexity, Groq, Apify, Google Cloud, GitHub, Notion, OpenWeather, and the local Bridge endpoint. Browser storage is local-development only; production secrets should live behind the Bridge or another backend.
4. Optional: run the Odysseus bridge on `http://127.0.0.1:8001` to enable bridge-backed chat. Set `VITE_BRIDGE_URL`, the Developer Settings endpoint override, or the credential-engine Bridge URL if your bridge runs elsewhere. Without it, the app falls back to the local diagnostic assistant.
5. ChatGPT/GPT models are not activated by a ChatGPT Pro subscription alone; they require OpenAI API access through a server-side bridge that secures your API key. The browser settings page can stage a key locally for setup handoff, but the frontend intentionally does not send OpenAI keys directly from the browser.
6. Run the app:
   `npm run dev`
7. Verify the app:
   `npm run lint`, `npm test`, and `npm run build`

## Integration Status

This repository is the active root runtime. It integrates:
- **Silver Wolf VI:** the Vite/React/Cesium app, chat shell, settings, telemetry, and astronomy views.
- **WorldwideView:** an optional ignored sub-project for advanced geospatial work. The root app includes Cesium and telescope/WWT-style runtime paths, but the `worldwideview/` dev stack still has its own install and database requirements.
- **Odysseus bridge:** optional local chat bridge, defaulting to `http://127.0.0.1:8001` and configurable through `VITE_BRIDGE_URL` or Developer Settings. The bridge now skips stale Odysseus sessions and degrades to a local diagnostic AI response when the bridge is offline or no Odysseus model endpoint is configured.

Integration should be treated as evidence-backed and conditional, not 100%. Local AI fallback, imagery defaults, astronomy math, the credential engine, bridge health, Odysseus health, ChromaDB vector memory, Browser MCP registration, UI verification, and mock/local-fallback proxy chat are covered by local checks. A real Odysseus model endpoint is not configured in this checkout, and the ignored `worldwideview/` stack still requires its own runtime setup.
`npm test` includes an integration contract check that verifies the mapped WorldwideView assets, Odysseus assets/source modules, and local bridge routes still exist.

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
