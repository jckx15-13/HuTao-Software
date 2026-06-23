# Silver Wolf VI Architecture Notes

Silver Wolf VI is a Vite + React chat and astronomy workspace with adaptive theming, local chat persistence, simulated system telemetry, local diagnostic AI responses, optional Gemini responses, optional Odysseus bridge responses, ArcGIS/OSM globe imagery, and Keplerian planet targeting. The app now favors small modules with clear ownership instead of large component files that mix rendering, state, side effects, and design copy.

## Current Module Map

### App Shell
- `src/App.tsx` owns the high-level shell: top app bar, layout, settings window, particle overlay, and theme wrapper.
- `src/App.tsx` lazy-loads the workspace layout, globe background, launcher, particle overlay, and custom cursor so first paint is not blocked by closed or opt-in surfaces.
- `src/hooks/useThemeVariables.ts` merges the active palette with any extracted wallpaper theme and applies CSS variables to the document.
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
- `src/lib/ai.ts` owns provider routing. The local diagnostic assistant works without external keys, Gemini requires `GEMINI_API_KEY`, and the Odysseus route requires the configured local bridge, defaulting to `http://127.0.0.1:8001`.
- `src/lib/bridgeConfig.ts` centralizes bridge URL normalization so chat, diagnostics, memory push, satellite proxy fallback, launcher checks, and the Odysseus console use the same endpoint.
- `bridge/server.py` allows the local dev and Vite preview origins by default; set `BRIDGE_CORS_ORIGINS` for any different hosted origin.
- `public/config.json` provides a non-secret browser config endpoint so production preview does not warn before falling back to env vars.
- `src/store/uiStore.ts` stores active chat messages explicitly and synchronizes them with the active chat session so the composer, message feed, and AI dispatcher observe the same current state.

### Settings and Theming
- `src/components/SettingsWindow.tsx` owns draggable/docked window behavior.
- `src/components/SettingsPane.tsx` owns theme selection, wallpaper upload, interface controls, model choice, and system instructions.
- `src/lib/themeEngine.ts` owns typed palette tokens, palette definitions, palette name formatting, and harmonic accent generation.

### Telemetry and Effects
- `src/components/SystemMonitor.tsx` renders simulated RAM, network, CPU, battery, storage, and shield state.
- `src/components/ParticleOverlay.tsx` renders the ambient canvas effect and respects the user's motion toggle.
- `src/hooks/useAudioFeedback.ts` owns Web Audio click/blip feedback.

### Globe, Imagery, and Astronomy
- `src/core/globe/ImageryProviderFactory.ts` owns imagery provider selection. `arcgis-world` is the default satellite imagery path, with OSM-style sources available as fallbacks.
- `src/lib/astronomy.ts` computes low-cost Keplerian apparent planet coordinates for Mars, Jupiter, Saturn, and Neptune instead of relying on static demo positions.
- `src/data/telescopePresets.ts` resolves planet presets dynamically and leaves deep-sky presets on fixed catalog coordinates.
- `src/hooks/cesium/useConstellations.ts` applies sidereal-time rotation so constellation overlays are tied to the current Earth orientation.

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
- Gemini and Odysseus behavior depends on external configuration. The app now gives a local diagnostic AI response when those providers are unavailable so chat can still be tested.
- Chat history is local-only and not versioned. If the message schema changes, add migration logic around `silverWolf.chatHistory`.
- Wallpaper object URLs are cleaned up when replaced/removed, but uploaded wallpaper is not persisted across reloads.
- The model selector exposes only currently wired routes. Keep it aligned with deployed providers instead of listing aspirational models.
- Browser-level Cesium/WWT validation is still sensitive to local WebGL automation stability, so source/build tests are necessary but not a substitute for normal-device smoke testing.

## Design Critique

What improved:
- Labels now use plain language: "New chat", "Wallpaper", "Motion effects", "Sound feedback", "Chat text size", and "System instructions" are more intuitive than the previous system-jargon-heavy copy.
- Icon buttons now share accessibility labels and titles.
- Settings and code blocks use smaller 8px radii for a tighter tool-like interface.
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
3. `src/lib/ai.ts` returns a deterministic local assistant response by default. Gemini requires `GEMINI_API_KEY`; Odysseus requires the configured local bridge.
4. The response is appended as a separate assistant message, which is what the browser and runtime tests verify.

## Bridge And Companion Repositories

1. `src/lib/bridgeConfig.ts` resolves the bridge URL from Developer Settings, `VITE_BRIDGE_URL`, or the local default.
2. `bridge/server.py` exposes the local status, chat, sync, diagnostics, camera proxy, git status, and generic Odysseus proxy routes.
3. `scripts/test_integration_contracts.cjs` verifies that mapped WorldWideView assets, copied Odysseus documentation assets, Odysseus source-module references, and bridge routes still exist.
4. The integration is conditional, not 100% complete: WorldWideView and Odysseus still have their own runtime requirements.

## Performance And Visual Load

1. `App.tsx` lazy-loads the workspace layout, globe background, launcher, particle overlay, custom cursor, settings, diagnostics, and telescope views.
2. Particle effects and the custom cursor are off by default; enabling particle effects opt-ins to the custom cursor.
3. `useThemeVariables.ts` computes the simulated load state that can reduce effects and keep text input responsive.
4. `npm run build` currently verifies that the production entry chunk stays below Vite's 500 kB warning threshold.


