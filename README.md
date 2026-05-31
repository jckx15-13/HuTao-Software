<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Silver Wolf VI

An adaptive cyberpunk chat interface with Gemini responses, local chat history, animated telemetry, wallpaper-based theme extraction, and configurable interface controls.

View your app in AI Studio: https://ai.studio/apps/d14a70cc-0c1f-444d-86d9-625b54096fee

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## WorldwideView Integration

The project includes a `worldwideview` sub-project for advanced geospatial features.

**Developer Note:** 
- **Installation:** Run `cd worldwideview && pnpm install` to set up the geospatial engine dependencies.
- **Database:** Local development in the `worldwideview` directory requires **Docker Desktop** to be running for the database services.
- **Environment:** If you prefer using an external database, you can set the `DATABASE_URL` in `worldwideview/.env`.
- **Ignore Path:** The `worldwideview/` directory is ignored by the root Git repository to avoid path length issues and recursive tracking conflicts on Windows.
- **Git Config:** If you encounter path length warnings on Windows, run `git config core.longpaths true` in your terminal.

## Project Notes

- Architecture, critique, and design notes live in [DOCS.md](DOCS.md).
- The main app code is split across `src/components`, `src/hooks`, `src/lib`, and `src/store`.
- Build verification: `npm run lint` and `npm run build`.
