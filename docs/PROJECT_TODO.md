# 🎯 Project TODO List

> Master checklist for Silver Wolf VI features, fixes, and architectural improvements. Based on the 10-dimension prioritization system.

---

## 🔥 Current High Priority (Run 10 Focus)

- [x] **Phase 0: Close Part A Cleanup**
  - Category: `UI/Refactor` | Tier: <span style="background:#E8F0FE;color:#1A73E8;padding:0.2em 0.4em;border-radius:0.3em;">🔵 Low</span>
  - Implementation: Cleaned obsolete CSS classes in `GoogleEarthRemix.css` and updated component docstrings in `SpaceHudPillControls.tsx`. `npm run qa:check` passed.
- [x] **Automated Documentation Generation**
  - Category: `DX` | Tier: <span style="background:#E8F0FE;color:#1A73E8;padding:0.2em 0.4em;border-radius:0.3em;">🔵 Low</span>
  - Implementation: `npm run docs:generate` owns a bounded inventory block in `DOCS.md`; `npm run docs:check` is part of `npm test` and fails when it drifts.

---

## ✅ Completed Tasks (Run 08 & 09)

- [x] **Space UI & Globe Runtime Hardening**
  - Implementation: Established explicit CesiumViewerStatus model, observable imagery loading/error contracts, removed obsolete orbital HUD CSS, and unified status bar clearance for globe navigation controls.
- [x] **API Key Sanitization in Logs**
  - Implementation: Added recursive `sanitize` helper to `diagnosticsStore.ts`.
- [x] **Component Virtualization for Chat**
  - Implementation: Integrated `react-virtuoso` in `ChatFeed.tsx`.
- [x] **Global Error Boundary Enhancement**
  - Implementation: Added `ChunkLoadError` detection and theme-consistent UI in `ErrorBoundary.tsx`.
- [x] **Uncommitted local edits detection**
  - Implementation: Added `/git/status` endpoint to Bridge and warning UI in Launcher.
- [x] **Plugin API Modernization (Phase 2)**
  - Implementation: Created `PluginSettingsList` and integrated into Settings pane for custom plugin config.
- [x] **Memoize Cesium Entities**
  - Implementation: Wired up `getCachedRenderOptions` in `useWWVGlobe.ts`.
- [x] **Keyboard Shortcuts for Navigation**
  - Implementation: Created `useKeyboardShortcuts` hook (Alt+1,2,3,S,W,L,R).

---

## ✅ Completed Tasks (Run 07)

- [x] **Visual Diagnostic Panel**
  - Implementation: Created `PluginInspector` and integrated into Settings.
- [x] **Theme Variable Naming Cleanup**
  - Implementation: Standardized `--theme-` prefix across `index.css`, `SystemMonitor.tsx`, and `geojson-importer.css`.
- [x] **Custom Hook for DataBus Subscription**
  - Implementation: Created `useDataBus` hook to safely handle event listeners.

---

## ✅ Historical Completed Tasks

- [x] ~~**Type Safety Phase 2**~~ (Resolved remaining UI `any` types in LeftPanel and others)
- [x] ~~**Plugin API Modernization (Reactive Streams)**~~ (Added `streamUnsubscribe` to `PluginManager`)
- [x] ~~**3D Telemetry Realism Pass**~~ (Live Earthquake/Weather 3D entities)
- [x] ~~**Imagery Switcher UI Implementation**~~
- [x] ~~**Redundant Config Fetching**~~
- [x] ~~**Live Weather Integration**~~
- [x] **Satellite SGP4 Refinement** (Fully Implemented)
- [x] ~~**Imagery Provider Metadata**~~
- [x] ~~`next-auth/jwt` missing~~
- [x] ~~Docker/local DB setup~~
- [x] ~~Cesium per-frame allocations~~
- [x] ~~Turbopack root warning~~
- [x] ~~Satellite TLE Ingestion~~
- [x] ~~Imagery Provider Switcher Logic~~
- [x] ~~Memory Leak Audit (Timers)~~

---

## 🛠 Quick Actions
1. **Uncommitted local edits detection** - Add a check in the launcher to warn if there are pending git changes.
2. **Plugin API Modernization (Phase 2)** - Standardize settings component injection.
