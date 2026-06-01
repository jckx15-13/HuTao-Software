# 🎯 Project TODO List

> Master checklist for Silver Wolf VI features, fixes, and architectural improvements. Based on the 10-dimension prioritization system.

---

## 🔥 Current High Priority (Run 07 Focus)

- [ ] **Visual Diagnostic Panel**
  - Category: `DX` | Tier: <span style="background:#FFFBDB;color:#8A6D00;padding:0.2em 0.4em;border-radius:0.3em;">🟡 Medium</span>
  - Why: Needed to inspect raw plugin telemetry (like TLE strings) easily within the UI.
- [ ] **Theme Variable Naming Cleanup**
  - Category: `Tech Debt` | Tier: <span style="background:#E8F7E6;color:#2D6A2D;padding:0.2em 0.4em;border-radius:0.3em;">🟢 Low</span>
  - Why: Standardize `--theme-` prefixing across all JS and CSS files.

---

## 🚦 Priority Tiers + Status

### 🔴 Critical (0)
*No critical issues detected.*

### 🟠 High (0)
*No high priority issues detected.*

### 🟡 Medium (1)
- [ ] **Visual Diagnostic Panel**

### 🟢 Low (2)
- [ ] **Theme Variable Naming Cleanup**
- [ ] **Plugin API Modernization (Phase 2)**

### ⚪ Trivial (1)
- [ ] **Uncommitted local edits detection**

---

## ✅ Completed Tasks

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

### 🟢 Low (3)
- [ ] **Visual Diagnostic Panel**
- [ ] **Theme Variable Naming Cleanup**
- [ ] **Plugin API Modernization**

### ⚪ Trivial (1)
- [ ] **Uncommitted local edits detection**

---

## ✅ Completed Tasks

- [x] ~~`next-auth/jwt` missing~~ (Build fix)
- [x] ~~Docker/local DB setup~~ (Documentation & README)
- [x] ~~Cesium per-frame allocations~~ (Performance optimization)
- [x] ~~`@sentry/nextjs` missing~~ (Verification)
- [x] ~~Turbopack root warning~~ (Config fix)
- [x] ~~Satellite TLE Ingestion~~ (Infrastructure established)
- [x] ~~Imagery Provider Switcher~~ (Core logic & UI)
- [x] ~~Large audit doc cleanup~~ (Archived to reduce noise)
- [x] ~~Git path warnings on Windows~~ (Documentation)

---

## 🛠 Quick Actions
1. **Move satellite logic** out of `uiStore.ts` into `SatelliteService.ts`.
2. **Implement OpenWeather seeder** for the Global Weather plugin.
3. **Add retry logic** to `EarthquakesPlugin` using exponential backoff.
