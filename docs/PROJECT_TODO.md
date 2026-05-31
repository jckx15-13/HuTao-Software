# 🎯 Project TODO List

> Master checklist for Silver Wolf VI features, fixes, and architectural improvements. Based on the 10-dimension prioritization system.

---

## 🔥 Current High Priority (Run 06 Focus)

- [ ] **Type Safety Phase 2 (UI components)**
  - Category: `Tech Debt` | Tier: <span style="background:#FFF0D6;color:#A35000;padding:0.2em 0.4em;border-radius:0.3em;">🟠 High</span>
  - Why: Fixed core hooks/stores; remaining 20+ occurrences in UI components need fixing.
- [ ] **Plugin API Modernization (Reactive Streams)**
  - Category: `Architecture` | Tier: <span style="background:#FFFBDB;color:#8A6D00;padding:0.2em 0.4em;border-radius:0.3em;">🟡 Medium</span>
  - Why: Legacy polling is inefficient; move to a reactive or subscription model.

---

## 🚦 Priority Tiers + Status

### 🔴 Critical (0)
*No critical issues detected.*

### 🟠 High (1)
- [ ] **Type Safety Overhaul**

### 🟡 Medium (2)
- [ ] **Visual Diagnostic Panel**
- [ ] **Plugin API Modernization**

---

## ✅ Completed Tasks

- [x] ~~**3D Telemetry Realism Pass**~~ (Live Earthquake/Weather 3D entities)
- [x] ~~**Imagery Switcher UI Implementation**~~
- [x] ~~**Redundant Config Fetching**~~
- [x] ~~**Live Weather Integration**~~
- [x] ~~**Satellite SGP4 Refinement**~~
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
