

# Silver Wolf VI

An adaptive cyberpunk chat and astronomy workspace with a local diagnostic AI path, Gemini responses when configured, an optional Odysseus bridge, local chat history, ArcGIS/OSM globe imagery, Keplerian planet targeting, simulated telemetry, wallpaper-based theme extraction, and configurable interface controls.

View your app in AI Studio: https://ai.studio/apps/d14a70cc-0c1f-444d-86d9-625b54096fee

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Optional: set `GEMINI_API_KEY` in [.env.local](.env.local) to enable Gemini models.
3. Optional: run the Odysseus bridge on `http://127.0.0.1:8001` to enable bridge-backed chat. Set `VITE_BRIDGE_URL` or the Developer Settings endpoint override if your bridge runs elsewhere. Without it, the app falls back to the local diagnostic assistant.
4. ChatGPT/GPT models are not activated by a ChatGPT Pro subscription alone; they require a server-side OpenAI bridge that secures your API key.
5. Run the app:
   `npm run dev`
6. Verify the app:
   `npm run lint`, `npm test`, and `npm run build`

## Integration Status

This repository is the active root runtime. It integrates:
- **Silver Wolf VI:** the Vite/React/Cesium app, chat shell, settings, telemetry, and astronomy views.
- **WorldwideView:** an optional ignored sub-project for advanced geospatial work. The root app includes Cesium and telescope/WWT-style runtime paths, but the `worldwideview/` dev stack still has its own install and database requirements.
- **Odysseus bridge:** optional local chat bridge, defaulting to `http://127.0.0.1:8001` and configurable through `VITE_BRIDGE_URL` or Developer Settings. The app now degrades to a local diagnostic AI response when the bridge is offline.

Integration should be treated as evidence-backed and conditional, not 100%. Local AI fallback, imagery defaults, and astronomy math run inside the root app; external keys, bridge services, and the ignored `worldwideview/` stack require separate runtime setup.
`npm test` includes an integration contract check that verifies the mapped WorldwideView assets, Odysseus assets/source modules, and local bridge routes still exist.

**Developer Note:** 
- **Installation:** Run `cd worldwideview && pnpm install` to set up the geospatial engine dependencies.
- **Database:** Local development in the `worldwideview` directory requires **Docker Desktop** to be running for the database services.
- **Environment:** If you prefer using an external database, you can set the `DATABASE_URL` in `worldwideview/.env`.
- **Ignore Path:** The `worldwideview/` directory is ignored by the root Git repository to avoid path length issues and recursive tracking conflicts on Windows.
- **Git Config:** If you encounter path length warnings on Windows, run `git config core.longpaths true` in your terminal.

## Project Notes

- Architecture, critique, and design notes live in [DOCS.md](DOCS.md).
- The main app code is split across `src/components`, `src/hooks`, `src/lib`, and `src/store`.
- Build verification: `npm run lint`, `npm test`, and `npm run build`.
