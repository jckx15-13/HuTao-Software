# Silver Wolf VI Project Report

**Date:** 2026-06-23  
**Branch focus:** UI clarity, local AI testability, imagery reliability, astronomy realism, and evidence-backed integration status

## Executive Summary

This pass converts several previously advertised or fragile behaviors into concrete, testable runtime paths:

- Chat now has a local diagnostic assistant that responds without external keys, so the AI loop can be tested immediately from the input bar.
- Active chat messages are now real Zustand state synchronized with the active chat session; the old derived getter could leave the rendered message list on a stale snapshot.
- Gemini remains available when `GEMINI_API_KEY` is configured.
- The Odysseus route is bridge-backed, defaults to `http://127.0.0.1:8001`, can be redirected through `VITE_BRIDGE_URL` or Developer Settings, and falls back locally when the bridge is offline.
- Browser-side OpenAI key handling was removed from the active UI because shipping direct GPT calls from the client is not a safe or working production integration.
- Default UI opacity, blur, particles, right-panel state, and cursor behavior were tightened to reduce overlap, glare, and sluggish pointer behavior.
- Startup JavaScript is split more aggressively; the production entry chunk is now under Vite's 500 kB warning threshold.
- The left navigation and passive telemetry column are no longer open by default in chat mode, and the chat surface now clears the mode switch instead of sitting underneath it.
- ArcGIS World Imagery is now the default imagery provider, with OSM-style options remaining as fallbacks.
- Planet presets now resolve through low-cost Keplerian ephemeris math instead of static demo coordinates.
- Constellation overlays are rotated by sidereal time so they track the current Earth orientation more realistically.
- Minimal mode now drives lower visual density/opacity values through the same state path used by all personalisation settings; minimal values are now preserved by normalization.
- In-app labels and docs were rewritten to avoid unsupported claims about fake security levels, guaranteed logging, or fully live/complete integrations.

## Feature Timeline

| Date | Theme | Status | Evidence |
|---|---|---|---|
| 2026-06-03 | Odysseus bridge integration baseline | Completed | `src/lib/ai.ts`, `src/lib/bridgeConfig.ts`, `bridge/server.py`, integration contract coverage. |
| 2026-06-08 | Astronomical realism and WWV contract | Completed | `src/lib/astronomy.ts`, `scripts/test_physics_and_runtime.cjs`, `scripts/test_integration_contracts.cjs`. |
| 2026-06-13 | GPT/OpenAI access hardening | In progress / clarified | `src/components/settings/AiSettings.tsx`, `src/hooks/useAIChat.ts`, `src/lib/ai.ts`; direct browser GPT routes removed from user options. |
| 2026-06-20 | Dependency remediation | Completed | `pnpm audit --json`, `pnpm-workspace.yaml` overrides, `DOCS.md`. |
| 2026-06-22 | Public contract + docs audit | Completed | `README.md`, `DOCS.md`, `scripts/test_integration_contracts.cjs` updates. |
| 2026-06-23 | Minimal mode parity | Completed | `src/store/uiStore.ts`, `src/components/settings/PersonalisationSettings.tsx`, `src/hooks/useThemeVariables.ts`. |
| 2026-06-24 | Copy honesty audit | Completed | `src/components/settings/SettingsPage.tsx`, `src/components/launcher/LauncherPage.tsx`, `src/components/dev/OdysseusConsole.tsx`, `DOCS.md`. |

## ChatGPT Access Position

- A ChatGPT Pro subscription does **not** directly unlock browser-side OpenAI keys for this app.
- In-browser OpenAI API calls are not presented as active product capabilities.
- GPT support in this branch is considered conditional and requires a server-side bridge/service to own credentials and runtime.
- Gemini and Odysseus remain operationally available under their configuration conditions.

## Integration Progress

### 1) AI Access Layer

Updated files:
- `src/lib/ai.ts`
- `src/lib/bridgeConfig.ts`
- `src/hooks/useAIChat.ts`
- `src/store/uiStore.ts`
- `src/components/settings/AiSettings.tsx`
- `vite.config.ts`
- `.env.example`

Current status:
- **Local diagnostic assistant:** integrated and deterministic.
- **Gemini:** integrated but conditional on `GEMINI_API_KEY`; model selectors use current Gemini text-output model IDs from the [Google AI model catalog](https://ai.google.dev/gemini-api/docs/models) as checked on 2026-06-23.
- **Odysseus:** integrated through a configurable local bridge route, conditional on the bridge service.
- **Bridge CORS:** local dev and Vite preview origins are allowed by default; `BRIDGE_CORS_ORIGINS` owns non-local hosted origins.
- **GPT/OpenAI:** not listed as a direct browser option. It needs a server-side bridge before it should be exposed as a production feature.

### 2) UI Responsiveness and Visual Clarity

Updated files:
- `src/App.tsx`
- `public/config.json`
- `src/store/uiStore.ts`
- `src/hooks/useThemeVariables.ts`
- `src/index.css`
- `src/components/panels/CenterPanel.tsx`

Current status:
- Custom cursor is opt-in through effects instead of forced on by default.
- Closed/opt-in surfaces now load as chunks: workspace layout, globe background, launcher, particle overlay, and custom cursor.
- Particle effects are off by default.
- The left navigation and right detail/telemetry panels are off by default in chat mode.
- The right panel starts closed by default.
- Chat panels now use more opaque surfaces, reducing globe bleed-through and eye strain.
- Persisted transparent/glass settings are migrated toward more solid defaults.
- Normal system notices now render as compact neutral chips instead of full-width red alert bars.
- Settings, launcher, chat, and Odysseus integration labels now describe actual local/conditional behavior instead of fake security, classification, or "neural" claims.

### 3) Imagery and Astronomy

Updated files:
- `src/core/globe/ImageryProviderFactory.ts`
- `src/core/state/configSlice.ts`
- `src/lib/astronomy.ts`
- `src/data/telescopePresets.ts`
- `src/hooks/cesium/useTelescopePresets.ts`
- `src/hooks/cesium/useConstellations.ts`
- `src/components/background/CesiumBackground.tsx`
- `src/components/panels/LeftPanel.tsx`
- `src/components/learning/WorldWideTelescopeView.tsx`

Current status:
- Default imagery now resolves to ArcGIS World Imagery instead of falling through to a weaker/default path.
- Mars, Jupiter, Saturn, and Neptune presets use Keplerian apparent equatorial coordinates.
- Deep-sky presets remain fixed catalog coordinates.
- Constellation overlays use GMST-based Earth rotation.

### 4) Repository Integration

The root Silver Wolf VI app, the ignored WorldwideView sub-project, and the optional Odysseus bridge are not honestly describable as 100% integrated because external setup is still required for the bridge and WorldwideView stack.

Current integration status:
- **Silver Wolf VI root app:** active runtime and validated by local commands.
- **WorldwideView:** partially integrated through root-app Cesium/WWT-style views and copied/runtime assets; the ignored sub-project still has separate install and database requirements.
- **Odysseus:** integrated as an optional configurable local bridge target with local fallback when offline.
- **Executable contract:** `scripts/test_integration_contracts.cjs` verifies the mapped WorldwideView assets, copied Odysseus docs/assets, Odysseus source-module references, and local bridge routes exist.

## Feature Legitimacy Matrix

Legend:
- **Verified:** deterministic source/test/build evidence exists.
- **Conditional:** behavior requires an external key, service, browser runtime, or sub-project setup.
- **Unverified Runtime:** code path exists, but current browser automation evidence is incomplete or flaky.

| Feature | Status | Why |
|---|---|---|
| Local AI chat response | Verified | `local-assistant` returns deterministic assistant text without external keys. |
| Gemini chat response | Conditional | Requires `GEMINI_API_KEY`. Missing key now falls back to a local diagnostic response. |
| Odysseus bridge chat | Conditional | Requires the configured local bridge service, defaulting to `127.0.0.1:8001`; otherwise falls back locally. |
| Bridge endpoint consistency | Verified | `src/lib/bridgeConfig.ts` normalizes REST/WS bridge URLs and tests assert override behavior. |
| Local bridge CORS defaults | Verified | Bridge defaults include local dev and Vite preview origins; integration tests assert the local preview origin remains listed. |
| Direct browser GPT/OpenAI route | Not active | Removed from user-facing options until a server-side bridge exists. |
| Minimal mode preset state | Verified | `PersonalisationSettings` and `useThemeVariables` preserve lower opacity/blur when `minimalMode` is enabled. |
| Active chat feed state | Verified | Zustand now stores active messages explicitly; tests assert separate user and AI messages. |
| Default visual clarity | Verified | Store defaults/migration and chat surface opacity were changed in source. |
| First-viewport overlap | Verified | Headless DOM-bounds smoke at 1366x768 reported no major region overlaps. |
| Fast/native cursor path | Verified | Custom cursor is gated behind opt-in effects. |
| Startup bundle warning | Verified | Production entry chunk is about 498 kB after lazy-loading closed/opt-in surfaces. |
| Runtime public config endpoint | Verified | `public/config.json` exists so the config loader does not warn before env fallback. |
| ArcGIS imagery default | Verified | Store/config defaults and provider factory now resolve `arcgis-world`. |
| Planet tracking | Verified | Planet presets resolve through Keplerian apparent coordinates. |
| Constellation tracking | Verified | Overlay longitudes account for GMST. |
| WorldwideView full external stack | Conditional | Still requires separate ignored sub-project setup. |
| WorldwideView/Odysseus asset-source contracts | Verified | `npm test` verifies mapped source assets, copied public assets, Odysseus module references, and bridge routes. |
| In-app copy honesty | Verified | Main settings, launcher, chat, and Odysseus labels avoid unsupported claims and use local/conditional status language. |

## Verification Snapshot

Commands for this pass:
- `npm run lint`
- `npm test`
- `npm run build`
- Puppeteer smoke on `http://127.0.0.1:3005/?fallback=true`

Browser automation note:
- The app dev server serves successfully on `http://localhost:3005/`.
- Puppeteer verified chat input -> separate local AI response, `arcgis-world`, particles off, side panels closed, and no major first-viewport overlaps at 1366x768.
- A production-preview smoke against `http://127.0.0.1:4174/?fallback=true` verified the same chat path after the bridge URL work; screenshot: `C:\Users\jaron\AppData\Local\Temp\silver-wolf-chat-layout-1366-preview.png`.
- A later in-app Browser smoke against `http://127.0.0.1:4175/?fallback=true` verified the lazy-loaded production workspace and chat path. Direct HTTP checks confirmed `/config.json` is now served with 200 from the preview build; the Browser log API still retained an older missing-config warning from before that file was added.
- `npm test` now includes `scripts/test_integration_contracts.cjs` for the three-repo/source-map contract.
- Browser-plugin control became available later in the session and was used for the production-preview smoke; earlier smoke checks used Puppeteer fallback before that tool was exposed.
- Normal-device GPU smoke testing remains required for Cesium/WWT visuals beyond the headless fallback path.

## Open Risks / Follow-ups

1. Add a server-side GPT bridge if GPT should return as a production feature.
2. Run manual Chrome/Edge smoke tests on a GPU-backed desktop session for Cesium and WWT visuals.
3. If the WorldwideView sub-project is intended to be part of the shipped app, move it into a tracked package/workspace with explicit build and runtime ownership.
4. Replace simulated telemetry with a single real telemetry service before presenting it as real device state.
