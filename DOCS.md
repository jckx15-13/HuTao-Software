# Silver Wolf VI Architecture Notes

Silver Wolf VI is a Vite + React chat and astronomy workspace with adaptive theming, local chat persistence, simulated system telemetry, local diagnostic AI responses, optional Gemini responses, optional Odysseus bridge responses, ArcGIS/OSM globe imagery, and light-time-corrected Keplerian planet targeting. The app now favors small modules with clear ownership instead of large component files that mix rendering, state, side effects, and design copy.

## Current Module Map

### App Shell
- `src/App.tsx` owns the high-level shell: top app bar, layout, settings window, particle overlay, and theme wrapper.
- `src/App.tsx` lazy-loads the workspace layout, globe background, launcher, particle overlay, and custom cursor so first paint is not blocked by closed or opt-in surfaces.
- `src/hooks/useThemeVariables.ts` merges the active palette with any extracted wallpaper theme and applies CSS variables to the document. The current defaults favor restored glass/rounded feature surfaces, with high-load clamps still reducing blur and motion when needed.
- `src/components/layout/DockedLayout.tsx` composes the main workspace, responsive side navigation, chat surface, and telemetry panel.
- `src/components/layout/SessionSidebar.tsx` owns the left navigation/session actions.

### Chat
- `src/components/ChatPanel.tsx` coordinates chat state, audio feedback, submit recoil animation, persistence, and AI sending.
- `src/components/chat/ChatHeader.tsx` owns clear/fullscreen actions.
- `src/components/chat/ChatFeed.tsx` owns feed rendering and auto-scroll behavior.
- `src/components/chat/MessageBubble.tsx` owns user, AI, and system message display.
- `src/components/chat/ChatComposer.tsx` owns input state, keyboard submit behavior, and send button state.
- `src/hooks/useChatPersistence.ts` loads/saves chat history in `localStorage`.
- `src/hooks/useAutoScroll.ts` handles scroll-to-bottom behavior and streaming content mutations.
- `src/lib/messages.ts` centralizes message types, IDs, storage key, and default/reset message factories.
- `src/lib/ai.ts` owns provider routing. The local diagnostic assistant works without external keys, Gemini reads from the credential engine or `GEMINI_API_KEY`, and the Odysseus route uses the configured local bridge, defaulting to `http://127.0.0.1:8001`.
- `src/lib/credentials/apiCredentialEngine.ts` owns the local API and connector credential registry for OpenAI, Gemini, Anthropic, OpenRouter, Mistral, Perplexity, Groq, Apify, Google Cloud, GitHub, Notion, OpenWeather, and the Bridge endpoint. It stores local-development credentials in a versioned browser vault, migrates legacy key fields, masks status, builds auth headers for connector code, and labels server-side-only providers honestly.
- `src/lib/credentials/apiConnectorEngine.ts` maps those providers to base URLs, probe URLs, capability tags, request descriptors, and browser-vs-backend routing rules so AI, Apify, Google Cloud/Maps, GitHub, Notion, OpenWeather, and Bridge integrations share one connector model.
- `src/services/weatherService.ts` reads OpenWeather credentials from the credential engine or `VITE_OPENWEATHER_API_KEY`; embedded demo weather keys are not used.
- `src/lib/bridgeConfig.ts` centralizes bridge URL normalization so chat, diagnostics, memory push, satellite proxy fallback, launcher checks, and the Odysseus console use the same endpoint. The Bridge endpoint override is now read from the credential engine.
- `bridge/server.py` owns server-side provider credential resolution for OpenAI-compatible model routes. It can use `OPENAI_API_KEY` + `OPENAI_MODEL`, `OPENROUTER_API_KEY` + `OPENROUTER_MODEL`, `MISTRAL_API_KEY` + `MISTRAL_MODEL`, `PERPLEXITY_API_KEY` + `PERPLEXITY_MODEL`, or `GROQ_API_KEY` + `GROQ_MODEL` without returning secret values to the browser.
- `bridge/server.py` allows the local dev and Vite preview origins by default through explicit origins plus `BRIDGE_CORS_ORIGIN_REGEX`; set `BRIDGE_CORS_ORIGINS` or `BRIDGE_CORS_ORIGIN_REGEX` for any different hosted origin.
- `public/config.json` provides a non-secret browser config endpoint so production preview does not warn before falling back to env vars.
- `src/store/uiStore.ts` stores active chat messages explicitly and synchronizes them with the active chat session so the composer, message feed, and AI dispatcher observe the same current state.

### Settings and Theming
- `src/components/SettingsWindow.tsx` owns draggable/docked window behavior.
- `src/components/SettingsPane.tsx` and `src/components/settings/*` own theme selection, wallpaper upload, interface controls, model choice, system instructions, credential-engine UI, connector readiness/probe metadata, connector settings, and bridge URL overrides.
- `src/lib/themeEngine.ts` owns typed palette tokens, palette definitions, palette name formatting, and harmonic accent generation.

### Telemetry and Effects
- `src/components/SystemMonitor.tsx` renders simulated RAM, network, CPU, battery, storage, and shield state.
- `src/components/ParticleOverlay.tsx` renders the ambient canvas effect and respects the user's motion toggle.
- `src/hooks/useAudioFeedback.ts` owns Web Audio click/blip feedback.

### Globe, Imagery, and Astronomy
- `src/hooks/cesium/useCesiumViewer.ts` starts Cesium with `baseLayer: false`, and `src/core/globe/useImageryManager.ts` is the single runtime owner that attaches selected imagery layers.
- `src/core/globe/ImageryProviderFactory.ts` owns imagery provider selection. It lazy-loads real Cesium provider constructors at runtime instead of returning browser-automation mocks; `arcgis-world` is the default satellite imagery path, with OSM-style sources available as fallbacks.
- `src/lib/astronomy.ts` computes low-precision Keplerian apparent planet coordinates for Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune. It applies iterative light-time correction and exposes geometric coordinates for tests, but it is not a JPL DE ephemeris.
- `src/data/telescopePresets.ts` resolves planet presets dynamically and leaves deep-sky presets on fixed catalog coordinates.
- `src/lib/coordinateTransforms.ts` precesses fixed J2000 star coordinates to the requested observation date before rendering.
- `src/hooks/cesium/useConstellations.ts` applies J2000-to-date precession and sidereal-time rotation so constellation overlays are tied to the current Earth orientation.

### Shared UI
- `src/components/common/IconButton.tsx` standardizes icon-only and icon+label buttons.
- `src/components/common/SectionHeader.tsx` standardizes settings section titles.

## Code Critique

What improved:
- The former `ChatPanel.tsx` was doing too much: history hydration, scroll logic, input state, message rendering, toolbar controls, audio, and animation. It is now split into focused chat modules and hooks.
- Palette data was loosely typed. `themeEngine.ts` now exposes explicit theme token types so future palette changes are harder to break silently.
- Message IDs and default/reset messages were duplicated and timestamp-based. `src/lib/messages.ts` now centralizes them.
- `SettingsPane.tsx` had repeated card/toggle markup and unclear labels. Controls are now more DRY and easier to scan.
- Unused dependencies were removed from `package.json`, and the heavy syntax-highlighter dependency was replaced with a lightweight themed code block.
- The old docs referenced non-existent components such as `DashboardPane.tsx`, `VentralPane.tsx`, `DorsalPane.tsx`, and `IdeaSandboxModule.tsx`; this document now matches the real code.
- The previous wallpaper theme dependency pulled in a vulnerable transitive parser. `src/lib/imageTheme.ts` now extracts a palette with browser canvas APIs, removing that dependency and reducing the install surface.

Remaining risks:
- The telemetry system is simulated in multiple places. If it becomes real data, move all metric updates into one telemetry service/hook.
- Gemini and Odysseus behavior depends on external model configuration. The app and bridge now give local diagnostic AI responses when those providers are unavailable so chat can still be tested without prompt echo.
- Chat history is local-only and not versioned. If the message schema changes, add migration logic around `silverWolf.chatHistory`.
- Wallpaper object URLs are cleaned up when replaced/removed, but uploaded wallpaper is not persisted across reloads.
- The model selector exposes only currently wired routes. Keep it aligned with deployed providers instead of listing aspirational models.
- Browser-level Cesium/WWT validation is still sensitive to local WebGL automation stability, so source/build tests are necessary but not a substitute for normal-device smoke testing.

## Design Critique

What improved:
- Labels now use plain language: "New chat", "Wallpaper", "Motion effects", "Sound feedback", "Chat text size", and "System instructions" are more intuitive than the previous system-jargon-heavy copy.
- Icon buttons now share accessibility labels and titles.
- Settings and workspace controls use compact spacing with rounded glass surfaces. Minimalism means fewer competing overlays, not flat or square controls.
- The layout is more responsive: the session sidebar starts at medium viewports and the telemetry panel starts at extra-large viewports, keeping mobile focused on chat.
- Reduced-motion users now get a calmer experience via a global media query.

Design concerns to keep watching:
- The interface still leans visually dense. That fits the concept, but future features should avoid adding more glow layers before adding clearer spacing or hierarchy.
- The settings window animation has personality, but it may feel too playful for long configuration sessions. Consider a "reduced motion" or "steady window" preference if users spend significant time there.
- The app has a strong purple/cyan signature. When adding new palettes, check contrast and avoid making all states feel like color variants of the same accent.
- The telemetry panel is attractive but decorative. If it remains simulated, keep it visually secondary so it does not imply real system diagnostics.

## Security Resolution Log

### 2026-06-20 Dependency Audit Remediation

Resolved the Dependabot/pnpm audit findings reported against `pnpm-lock.yaml`:
- `vite` was updated from `6.4.2` to `6.4.3` to address GHSA-fx2h-pf6j-xcff and GHSA-v6wh-96g9-6wx3.
- `cesium` was updated from `1.141.0` to `1.142.0`, which resolves its transitive `dompurify` from `3.4.7` to `3.4.11` and its transitive `protobufjs` from `8.5.0` to `8.6.4`.
- `@google/genai` was updated from `1.29.0` to `1.52.0`; `pnpm-workspace.yaml` also pins the transitive `protobufjs@<8` line to `7.6.3`.
- `pnpm-workspace.yaml` now includes overrides for `vite`, `dompurify`, and both affected `protobufjs` major-version ranges so future lockfile regeneration keeps the patched versions.

Validation:
- `pnpm audit --json` reports zero vulnerabilities.
- `pnpm-lock.yaml` resolves `vite@6.4.3`, `dompurify@3.4.11`, `protobufjs@7.6.3`, and `protobufjs@8.6.4`.

## Verification

- Current 2026-06-23 validation: `npm run lint` passes.
- Current 2026-06-23 validation: `npm test` passes the cursor contract test, physics/astronomy/local-AI runtime test, bridge URL normalization checks, and repository integration contract test.
- Current 2026-06-23 validation: `npm run build` passes with the entry chunk reduced to about 498 kB, below Vite's 500 kB warning threshold.
- Current 2026-06-23 browser smoke: `http://127.0.0.1:3005/?fallback=true` accepts input in the chat composer, appends a separate local AI response, defaults to `arcgis-world`, keeps particles and side panels off, and reports no major first-viewport region overlaps at 1366x768.
- Current 2026-06-23 production-preview smoke: temporary Vite preview at `http://127.0.0.1:4174/?fallback=true` produced the same separate user/local-AI message flow; screenshot evidence is `C:\Users\jaron\AppData\Local\Temp\silver-wolf-chat-layout-1366-preview.png`.
- Current 2026-06-24 mobile production-preview smoke: temporary Vite preview at `http://127.0.0.1:4178/?fallback=true` accepted a mobile chat prompt, cleared the composer, appended a compact local assistant response that did not echo the prompt text, and reported no visible control overlaps in the 390x844 viewport scan.
- Current 2026-06-24 imagery source contract: Cesium viewer startup now disables implicit world imagery and the integration test verifies that `useImageryManager` is the only selected imagery attachment path.
- Current 2026-06-24 real-route production-preview smoke: temporary Vite preview at `http://127.0.0.1:4180/` launched the workspace, rendered the Cesium canvas/container, showed no fresh `tileXYToRectangle` imagery error after the provider-factory fix, accepted a chat prompt, cleared the composer, and appended the compact non-echo local assistant response.
- Current 2026-06-24 astronomy contract: the runtime test verifies every supported planet preset resolves to finite RA/Dec, AU distance, and positive light-time metadata; Mars apparent coordinates differ from same-time geometric coordinates, proving light-time correction is active.
- Current 2026-06-24 compact spatial HUD smoke: temporary Vite preview at `http://127.0.0.1:4182/?fallback=true` in Space mode rendered the collapsed HUD opener as one 44x44 icon-only button with `aria-label="Open spatial HUD sidebar"`; the old bulky text `Spatial HUD collapsed. Controls moved to sidebar.` and `Open HUD` text button were absent, and the browser reported no fresh relevant console warnings.
- Current 2026-06-24 constellation contract: the runtime test verifies fixed catalog star coordinates remain unchanged at J2000 but precess away from their J2000 RA/Dec by 2026; integration tests verify both Cesium and WWT constellation renderers call the shared precession transform.
- Current 2026-06-24 visual-readability contract: integration tests verify default CSS panel opacity/blur match the readable runtime defaults, large telescope HUD panels use stronger opaque glass, and the cursor wrapper keeps the native cursor during high-load fallback.
- Current 2026-06-24 runtime performance guard: when CPU load is high, app theme clamps blur to a minimal value and nudges panel opacity for readable, lower-cost compositing while preserving the same fallback paths.
- Current 2026-06-24 bottom telemetry contract: the WWT timeline has a centered top icon button that collapses the full telemetry/timeline panel into a slim bottom bar and expands it again; integration tests verify the labels and collapsed-state guard.
- Current 2026-06-25 UI restoration pass: chat no longer renders the redundant `CHAT INTERFACE READY` strip, the workspace no longer reserves a blocking top app bar, the Chat/Space switcher keeps compact rounded controls with restrained animation, and sidebars default open again so documented feature surfaces remain reachable.
- Current 2026-06-25 globe readability pass: Cesium credit UI is compacted/non-blocking, satellite labels use globe occlusion instead of drawing through Earth, and restored feature surfaces remain subject to high-load performance guards.
- Current 2026-06-25 AI configuration pass: Settings -> AI Configuration exposes local input bars for Gemini key staging, OpenAI key setup handoff, and bridge URL override. Gemini can use the staged key for local browser testing; OpenAI keys are not sent directly from the frontend and require a server-side bridge.
- Current 2026-06-25 bridge chat pass: `/chat` skips stale Odysseus sessions, returns the verifier mock LLM response while the mock endpoint is running, and otherwise returns a local bridge assistant response without echoing the user prompt when no Odysseus or server-side provider model endpoint is configured.
- Current 2026-06-25 runtime integration verification: `node scripts/verification_harness/verify_system.cjs` passes Vite, Bridge, Odysseus health, ChromaDB heartbeat, database seed/cleanup, proxy chat through the mock LLM, Space/globe DOM state, telemetry DOM state, and AI Settings source contracts. The report remains `PARTIAL` because no real Odysseus or server-side AI provider model endpoint is configured.
- Current 2026-06-25 validation: `npm test`, `npm run lint`, and `npm run build` pass. The repository integration contract reports 96/100, not 100/100, because runtime dependency scoring keeps the missing real model/provider endpoint visible.
- Previous dependency pass: `pnpm audit --json` reported zero vulnerabilities after the 2026-06-20 remediation.

---

# Runtime Connection Map

This section lists the current, source-backed wiring. It intentionally avoids claims about security, telemetry, or integrations that are not active in the root app.

## Settings To Theme

1. `SettingsPage.tsx` and the settings sub-panels write user choices into `src/store/uiStore.ts`.
2. `src/hooks/useThemeVariables.ts` reads the active palette and personalization values.
3. The hook writes CSS custom properties onto `document.documentElement`.
4. Components consume those CSS variables through Tailwind/CSS classes. Uploaded wallpapers are used for the current session only unless persistence is added later.

## Chat To AI Route

1. `ChatComposer.tsx` captures text and calls `ChatPanel.tsx`.
2. `useAIChat.ts` writes the user message to the active Zustand chat session, sets processing state, and routes the request.
3. `src/lib/ai.ts` returns a deterministic local assistant response by default without echoing the prompt text. Gemini uses the credential-engine Gemini key or `GEMINI_API_KEY`; Odysseus uses the configured local bridge and falls back locally when the bridge or model endpoint is unavailable.
4. The response is appended as a separate assistant message, which is what the browser and runtime tests verify.

## Bridge And Companion Repositories

1. `src/lib/bridgeConfig.ts` resolves the bridge URL from Developer Settings, the credential engine, `VITE_BRIDGE_URL`, or the local default.
2. `bridge/server.py` exposes the local status, chat, sync, diagnostics, camera proxy, git status, credential-provider status, and generic Odysseus proxy routes. Its chat route skips stale sessions, uses configured Odysseus model endpoints when available, then server-side OpenAI-compatible provider endpoints when configured, then the verifier mock LLM when present, and otherwise returns a local diagnostic assistant response. `BRIDGE_SKIP_ODYSSEUS_START=1` exists for isolated verifier runs that prove provider routing without starting a second Odysseus process. Localhost and `127.0.0.1` frontend ports are allowed through the default CORS regex so preview ports do not silently break bridge status checks.
3. `scripts/verification_harness/verify_system.cjs` starts a temporary Bridge with dummy server-provider credentials pointed at the mock OpenAI-compatible endpoint. That verifies `mode: server-provider` routing mechanics without claiming a live external account is configured.
4. `scripts/test_integration_contracts.cjs` verifies that mapped WorldWideView assets, copied Odysseus documentation assets, Odysseus source-module references, credential-engine provider contracts, connector-engine contracts, server-provider bridge/verifier contracts, bridge routes, and bridge CORS defaults still exist.
5. The integration is conditional, not 100% complete: ChromaDB vector memory and Odysseus Browser MCP now register locally, but a real Odysseus or server-side provider model endpoint is still not configured and WorldWideView still has its own runtime requirements.

## Performance And Visual Load

1. `App.tsx` lazy-loads the workspace layout, globe background, launcher, particle overlay, custom cursor, settings, diagnostics, and telescope views.
2. Particle effects and the custom cursor are feature defaults again. They still shut off under high-load, reduced-motion, coarse-pointer, hidden-document, or low animation-intensity conditions so the native cursor remains responsive.
3. The cursor wrapper avoids constructing the custom cursor engine in high-load, reduced-motion, coarse-pointer, hidden-document, and headless verification states, avoiding hidden or lagging cursor feedback.
4. `useThemeVariables.ts` clamps normal-mode panels to readable opacity and blur, and `index.css` uses the same fallback defaults before React hydrates.
5. `npm run build` currently verifies that the production entry chunk stays below Vite's 500 kB warning threshold.


