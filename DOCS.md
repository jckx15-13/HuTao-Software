# Silver Wolf VI Architecture Notes

Silver Wolf VI is a Vite + React chat interface with adaptive theming, local chat persistence, simulated system telemetry, and Gemini-backed responses. The app now favors small modules with clear ownership instead of large component files that mix rendering, state, side effects, and design copy.

## Current Module Map

### App Shell
- `src/App.tsx` owns the high-level shell: top app bar, layout, settings window, particle overlay, and theme wrapper.
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

### Settings and Theming
- `src/components/SettingsWindow.tsx` owns draggable/docked window behavior.
- `src/components/SettingsPane.tsx` owns theme selection, wallpaper upload, interface controls, model choice, and system instructions.
- `src/lib/themeEngine.ts` owns typed palette tokens, palette definitions, palette name formatting, and harmonic accent generation.

### Telemetry and Effects
- `src/components/SystemMonitor.tsx` renders simulated RAM, network, CPU, battery, storage, and shield state.
- `src/components/ParticleOverlay.tsx` renders the ambient canvas effect and respects the user's motion toggle.
- `src/hooks/useAudioFeedback.ts` owns Web Audio click/blip feedback.

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
- System instructions are currently prepended to each prompt. A production Gemini integration should use the provider's structured system instruction field once model/API behavior is confirmed.
- Chat history is local-only and not versioned. If the message schema changes, add migration logic around `silverWolf.chatHistory`.
- Wallpaper object URLs are cleaned up when replaced/removed, but uploaded wallpaper is not persisted across reloads.
- The model selector changes runtime state but does not validate model availability. Keep options aligned with the deployed Gemini account.

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

## Verification

- `npm run lint` passes.
- `npm run build` passes.
- `npm audit --omit=dev` reports 0 vulnerabilities.
- Production chunks are split by React, Gemini AI, Markdown, Motion, and app code.
