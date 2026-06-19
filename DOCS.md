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

- `npm run lint` passes.
- `npm run build` passes.
- `npm audit --omit=dev` reports 0 vulnerabilities.
- Production chunks are split by React, Gemini AI, Markdown, Motion, and app code.

---

# 🍼 The Toddler's Guide to Silver Wolf VI (How the Toys Connect & Support Each Other!)

Hello, tiny friend! We added comments inside each code file telling you exactly what each line is doing. But how do the files talk to each other? Let's trace the secret pathways that connect all our toys so they work as a team!

---

## 🔗 Connection 1: How Settings Change the Paint Colors (Store ➔ Hook ➔ HTML)

Imagine you have a **Brain Store** ([uiStore.ts](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20%28M365%20T&L%29/Documents/silver-wolf-vi/src/store/uiStore.ts)) that remembers your favorite paint color. But the store is just a memory—it doesn't have hands to paint the screen!

1. You click a new theme in the settings screen.
2. The **Brain Store** updates its note (e.g. `activePalette` changes).
3. The **Color Hook** ([useThemeVariables.ts](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20%28M365%20T&L%29/Documents/silver-wolf-vi/src/hooks/useThemeVariables.ts)) is watching that note. As soon as it changes, the hook grabs the hex codes (like `#ff00ff`) from the **Color Palette Book** (`themeEngine.ts`).
4. The hook reaches out to the raw web browser and writes those colors directly onto the browser's skin (`document.documentElement.style.setProperty`).
5. Every single button and text box on the page reads these properties to paint themselves neon, holographic, or matrix green!

---

## 🔗 Connection 2: How a Message Triggers Motion and Sound (Composer ➔ Panel ➔ Sound & Animation)

When you press the Send button, it starts a chain reaction across three different files to make the app feel alive:

1. **The Writer** (`ChatComposer.tsx`) captures your typed keys and triggers a submission callback.
2. **The Panel** ([ChatPanel.tsx](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20%28M365%20T&L%29/Documents/silver-wolf-vi/src/components/ChatPanel.tsx)) catches this callback and does two things immediately:
   - It wiggles its container by triggering spring physical motion coordinates.
   - It calls the **Sound Blaster Hook** ([useAudioFeedback.ts](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20%28M365%20T&L%29/Documents/silver-wolf-vi/src/hooks/useAudioFeedback.ts)) to synthesize an arcade keypress sound.
3. Concurrently, **The Talker** ([useAIChat.ts](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20%28M365%20T&L%29/Documents/silver-wolf-vi/src/hooks/useAIChat.ts)) sends your message out to the Gemini AI server on the internet.
4. When the answer lands, **The Panel** detects the new text bubble and instructs the **Sound Blaster Hook** to play a "blip!" notifying you that the robot finished thinking.

---

## 🔗 Connection 3: How the App Cools Down if the Computer gets Sweaty (Load Factor Throttling)

If your computer gets hot or has too many tasks running, we have a safety system that coordinates a cool-down across the entire workspace:

1. The simulated CPU metric goes above 80% (`isHighLoad` is true).
2. The **Main Box** ([App.tsx](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20%28M365%20T&L%29/Documents/silver-wolf-vi/src/App.tsx)) turns off the floaty firefly dots (`ParticleOverlay`) and standardizes your custom cursor pointer back to default.
3. The **Chat Panel** ([ChatPanel.tsx](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20%28M365%20T&L%29/Documents/silver-wolf-vi/src/components/ChatPanel.tsx)) dampens its spring recoil motion.
4. The **Workspace Organizer** ([DockedLayout.tsx](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20%28M365%20T&L%29/Documents/silver-wolf-vi/src/components/layout/DockedLayout.tsx)) hides the complex System Monitor gauge, replacing it with a simple passive block.
5. Once load factor drops, all layout pieces smoothly restore their animations and canvas dots together!


