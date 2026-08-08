# World Wide Telescope (WWT) & WorldWideView (WWV) Integration Architecture Plan

This document details the complete 3-column by 2-row transformation architecture, source-to-destination file inventory, exact static asset copy manifest, mathematical derivations, dead-code triage, and six-phase execution plan for integrating **WorldWideView (WWV)** (`https://github.com/silvertakana/worldwideview`) and **World Wide Telescope (WWT)** into **Silver Wolf VI**.

---

## 1. Master Transformation Matrix (Source ➔ Changes ➔ Destination)

```mermaid
flowchart LR
    subgraph WWV_ROW ["ROW 1: WORLDWIDEVIEW (WWV) INTEGRATION PIPELINE"]
        direction LR
        subgraph WWV_SRC ["1. WWV Source Architecture"]
            direction TB
            V1["WWV Static GeoJSON Data<br/>(borders.geojson, cameras, military_bases)"]:::wwv
            V2["WWV 3D Models & Icons<br/>(airplane.zip, plane-icon.svg)"]:::wwv
            V3["WWV Layer Manifest Schema<br/>(worldwideview/public/data/manifest.json)"]:::wwv
            V4["WWV DataBus & Zustand Store<br/>(WebSocket /stream, entitySlice, filterSlice)"]:::wwv
            V5["WWV Geographic Ground Landmarks<br/>(Observatories & Launchpads)"]:::wwv
            V6["WWV Prisma 7 Schema & Agent Bus<br/>(schema.prisma & szski/wwv-mcp)"]:::prisma
        end

        subgraph WWV_CHG ["2. Required Changes / Adapters"]
            direction TB
            A1["Local Asset Sync Build Script<br/>(scripts/sync_wwv_assets.cjs)"]:::adapter
            A2["Local-First URL Candidate Resolver<br/>(getWwtAssetLocalCandidateUrls)"]:::adapter
            A3["Manifest & Plugin Layer Parser<br/>(loadFromManifest())"]:::adapter
            A4["Store Ownership Boundary Sync<br/>(uiStore.ts vs store.ts)"]:::adapter
            A5["Landmark Terrain Clamping Policy<br/>(HeightReference.CLAMP_TO_GROUND)"]:::adapter
            A6["Database & Agent Bridge Adapter<br/>(PostgreSQL Models & LLM SSE Surface)"]:::adapter
        end

        subgraph WWV_DST ["3. Silver Wolf VI Destination Files"]
            direction TB
            S1["public/wwv-assets/*.geojson<br/>(scripts/sync_wwv_assets.cjs)"]:::swvi
            S2["src/lib/wwt/repositoryData.ts<br/>(airplane.zip & plane-icon.svg)"]:::swvi
            S3["src/core/plugins/parseWwvManifest.ts<br/>(Dynamic Plugin Manifest Parser)"]:::swvi
            S4["src/store/uiStore.ts & store.ts<br/>(Decoupled State Management Slices)"]:::swvi
            S5["src/hooks/cesium/useLandmarks.ts<br/>(Terrain Clamping Primitive Hook)"]:::swvi
            S6["worldwideview/prisma/schema.prisma<br/>(Multi-Tenant Database Models)"]:::swvi
        end

        V1 --> A1 --> S1
        V2 --> A2 --> S2
        V3 --> A3 --> S3
        V4 --> A4 --> S4
        V5 --> A5 --> S5
        V6 --> A6 --> S6
    end

    subgraph WWT_ROW ["ROW 2: WORLD WIDE TELESCOPE (WWT) INTEGRATION PIPELINE"]
        direction LR
        subgraph WWT_SRC ["1. WWT Source Architecture"]
            direction TB
            W1["WWT WebGL Iframe Research App<br/>(web.wwtassets.org/research/latest/)"]:::wwt
            W2["WWT All-Sky Surveys<br/>(DSS Color Visible, Chandra X-Ray, Planck, Radio)"]:::wwt
            W3["postMessage Telemetry API<br/>(wwt_view_state: ra, dec, fov, roll, target)"]:::wwt
            W4["Cesium Camera Altitude H<br/>(Camera Height d = Re + H)"]:::wwt
            W5["J2000 Celestial Frame & ERA<br/>(Equatorial Grid & Sidereal Time)"]:::wwt
            W6["Space HUD Controls & Timeline<br/>(NAV/LAYERS Pill, Timeline Scrubbing)"]:::wwt
        end

        subgraph WWT_CHG ["2. Required Changes / Adapters"]
            direction TB
            B1["Iframe Host Wrapper & PiP Clamp<br/>(Watchdog Timer & 4-Tab Control Drawer)"]:::adapter
            B2["Survey Preset Catalog Mapper<br/>(TELESCOPE_PRESETS Array)"]:::adapter
            B3["Anti-Loop Mutex & 32ms Throttle<br/>(syncSource Lock: none|cesium|wwt)"]:::adapter
            B4["Exact Horizon FOV Engine<br/>(FOV = 2 * arcsin(Re / (Re+H)))"]:::adapter
            B5["Precession & Sidereal Math Matrix<br/>(IAU 1976 Precession & ERA Matrices)"]:::adapter
            B6["HUD Action Dispatcher & SGP4 Linker<br/>(Docked Pill Actions & SGP4 Orbits)"]:::adapter
        end

        subgraph WWT_DST ["3. Silver Wolf VI Destination Files"]
            direction TB
            T1["src/components/learning/WorldWideTelescopeView.tsx<br/>(View Host Container File)"]:::swvi
            T2["src/data/telescopePresets.ts<br/>(Deep-Sky Survey Catalog File)"]:::swvi
            T3["src/hooks/useWWTListener.ts<br/>(Telemetry Event Listener Hook File)"]:::swvi
            T4["src/hooks/useCameraSync.ts<br/>(Camera Synchronization Engine File)"]:::swvi
            T5["src/lib/coordinateTransforms.ts<br/>(Celestial Transformation Math File)"]:::swvi
            T6["src/components/panels/SpaceHudPillControls.tsx<br/>(Docked HUD & Timeline Components)"]:::swvi
        end

        W1 --> B1 --> T1
        W2 --> B2 --> T2
        W3 --> B3 --> T3
        W4 --> B4 --> T4
        W5 --> B5 --> T5
        W6 --> B6 --> T6
    end

    classDef wwt fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#e0e7ff;
    classDef wwv fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ecfdf5;
    classDef prisma fill:#581c87,stroke:#a855f7,stroke-width:2px,color:#fae8ff;
    classDef agent fill:#701a75,stroke:#f43f5e,stroke-width:2px,color:#fff1f2;
    classDef adapter fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fef3c7;
    classDef swvi fill:#0f172a,stroke:#0284c7,stroke-width:2px,color:#e0f2fe;

    linkStyle 0 stroke:#10b981,stroke-width:2.5px;
    linkStyle 1 stroke:#10b981,stroke-width:2.5px;
```

---

## 2. Complete Asset Copy Manifest & File Inventory

### 2.1 Exact Assets Copied from WWV Repository (`worldwideview/public` ➔ `public/wwv-assets/`)

Executed automatically via `node scripts/sync_wwv_assets.cjs`:

| WWV Source Relative Path | Source File Size | Silver Wolf VI Destination Path | Primary Purpose |
|---|---|---|---|
| `worldwideview/public/borders.geojson` | 4,045,883 B (4.04 MB) | `public/wwv-assets/borders.geojson` | International administrative boundary vectors |
| `worldwideview/public/cameras_geojson.json` | 1,935,913 B (1.93 MB) | `public/wwv-assets/cameras_geojson.json` | Global live webcam location features |
| `worldwideview/public/public-cameras.json` | 1,818,577 B (1.81 MB) | `public/wwv-assets/public-cameras.json` | Public camera metadata index |
| `worldwideview/public/military_bases.geojson` | 6,656,037 B (6.65 MB) | `public/wwv-assets/military_bases.geojson` | Military installation & airbase markers |
| `worldwideview/public/airplane.zip` | 82,125 B (82.1 KB) | `public/wwv-assets/airplane.zip` | 3D aircraft glTF model bundle |
| `worldwideview/public/plane-icon.svg` | 445 B | `public/wwv-assets/plane-icon.svg` | Commercial aviation map billboard icon |
| `worldwideview/public/military-plane-icon.svg` | 351 B | `public/wwv-assets/military-plane-icon.svg` | Military aviation map billboard icon |
| `worldwideview/public/favicon.svg` | 960 B | `public/wwv-assets/favicon.svg` | Asset brand icon |
| `worldwideview/public/data/satellites.json` | ~450 KB | `public/wwv-assets/data/satellites.json` | Initial TLE orbital catalog dataset |

---

### 2.2 Direct Source-to-Destination File Inventory Mapping

#### Row 1: WorldWideView (WWV) Code Modules
| WWV Source Component | Changes & Adapters Required | Silver Wolf VI Destination File |
|---|---|---|
| Asset Sync Pipeline | Predev & prebuild lifecycle runner | [scripts/sync_wwv_assets.cjs](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/scripts/sync_wwv_assets.cjs) |
| Asset Resolver (`worldwideview`) | Add `getWwtAssetLocalCandidateUrls` local-first check | [src/lib/wwt/repositoryData.ts](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/lib/wwt/repositoryData.ts) |
| Dynamic Layer Manifests | Wire `loadFromManifest()` layer initialization | [src/core/plugins/parseWwvManifest.ts](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/core/plugins/parseWwvManifest.ts) |
| Zustand Stores (`entitySlice`, `filterSlice`) | Define clear boundary between UI store & domain store | [src/store/uiStore.ts](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/store/uiStore.ts) / [src/core/state/store.ts](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/core/state/store.ts) |
| Static Ground Features | Apply `HeightReference.CLAMP_TO_GROUND` clamping | [src/hooks/cesium/useLandmarks.ts](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/hooks/cesium/useLandmarks.ts) |

#### Row 2: World Wide Telescope (WWT) Code Modules
| WWT Source Telemetry / Component | Changes & Adapters Required | Silver Wolf VI Destination File |
|---|---|---|
| Remote WebGL Iframe (`web.wwtassets.org`) | Responsive iframe wrapper, PiP bounds clamp, watchdog | [src/components/learning/WorldWideTelescopeView.tsx](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/components/learning/WorldWideTelescopeView.tsx) |
| All-Sky Surveys (DSS, Chandra, Planck, Radio) | Catalog array mapping & layer selection dispatch | [src/data/telescopePresets.ts](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/data/telescopePresets.ts) |
| postMessage Telemetry (`wwt_view_state`) | Mutex lock (`syncSource`) + 32ms (~30 FPS) throttle timer | [src/hooks/useWWTListener.ts](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/hooks/useWWTListener.ts) |
| Cesium ECEF Camera Altitude H | Exact horizon FOV: $\text{FOV} = 2 \arcsin\left(\frac{R_E}{R_E + H}\right)$ | [src/hooks/useCameraSync.ts](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/hooks/useCameraSync.ts) |
| Celestial J2000 Coordinates | IAU 1976 Precession & Earth Rotation Angle (ERA) matrices | [src/lib/coordinateTransforms.ts](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/lib/coordinateTransforms.ts) |
| Space HUD Controls | Docked pill strip beneath mode switcher pill | [src/components/panels/SpaceHudPillControls.tsx](file:///home/admin/Documents/silver-wolf-vi/silver-wolf-vi/src/components/panels/SpaceHudPillControls.tsx) |

---

## 3. Mathematical Foundation: Complete Earth-Moon Orbit Derivations

### 3.1 Physical Constants
- $R_E$: Earth equatorial radius = $6,378.137\text{ km} = 6,378,137\text{ m}$
- $R_M$: Moon mean radius = $1,737.4\text{ km} = 1,737,400\text{ m}$
- $d_{EM}$: Mean Earth–Moon center-to-center distance = $384,400\text{ km}$

### 3.2 Fixed Midpoint Vantage Distance ($d$) & Surface Altitude ($h$)
$$d = \frac{d_{EM}}{2} = \frac{384,400\text{ km}}{2} = 192,200\text{ km}$$
$$h = d - R_E = 192,200 - 6,378.137 = 185,821.863\text{ km}$$

### 3.3 Exact Earth Angular Radius ($\theta_E$) & Framing FOV
$$\theta_E = \arcsin\left(\frac{R_E}{d}\right) = \arcsin\left(\frac{6,378.137}{192,200}\right) = \arcsin(0.0331848957) = 1.90170427^\circ$$
$$\text{FOV}_{\text{exact}} = 2 \theta_E = 3.80340855^\circ \approx 3.8034^\circ$$

### 3.4 Tangent Planar Approximation Comparison & Error Derivation
$$\text{FOV}_{\text{approx}} = 2 \arctan\left(\frac{R_E}{h}\right) = 2 \arctan\left(\frac{6,378.137}{185,821.863}\right) = 3.93172242^\circ$$
$$\Delta = \text{FOV}_{\text{approx}} - \text{FOV}_{\text{exact}} = 3.931722^\circ - 3.803408^\circ = +0.128314^\circ$$
$$\text{Relative Error} = \frac{0.128314^\circ}{3.803408^\circ} \times 100\% = \mathbf{+3.3736\% \text{ systematic visual distortion}}$$

> [!IMPORTANT]
> Silver Wolf VI uses the exact spherical formulation $\text{FOV}(H) = 2 \arcsin\left(\frac{R_E}{R_E + H}\right)$, eliminating the +3.3736% systematic visual distortion present in planar approximation models.

### 3.5 Moon Angular Radius ($\theta_M$) & Apparent Size Ratio
$$\theta_M = \arcsin\left(\frac{1,737.4}{192,200}\right) = 0.5179357^\circ \implies 2 \theta_M = 1.035871^\circ$$
$$\frac{2 \theta_E}{2 \theta_M} = \frac{3.803408^\circ}{1.035871^\circ} = \mathbf{3.67170\times}$$

---

## 4. Dead-Code Triage & Remediation Matrix

| Module Path | Lines | Category | Status & Action Plan |
|---|---|---|---|
| `src/core/filters/filterEngine.ts` | 61 | **A (Wiring Bug)** | **Wire**: Connect `filterSlice.ts` state to `applyFilters` engine. |
| `src/core/plugins/parseWwvManifest.ts` | 48 | **A (Wiring Bug)** | **Wire**: Hook `loadFromManifest()` into local asset initialization. |
| `wwv-sdk/vite/wwvStaticCompiler.ts` | 185 | **A (Wiring Bug)** | **Register**: Include static asset compiler in Vite build pipeline. |
| `src/store/learningStore.ts` | 54 | **B (Unwired Feature)** | **Retain/Defer**: Learning concepts overlay state. |
| `src/components/learning/LearningHub.tsx` | 82 | **B (Unwired Feature)** | **Retain/Defer**: Learning concepts component UI. |
| `src/core/data/countries.ts` | 742 | **B (Unwired Feature)** | **Retain**: Country metadata dataset pending geographic lookup integration. |
| `src/components/SettingsPane.tsx` | 481 | **C (Superseded)** | **Deleted**: Replaced by inline theme overlay controls. |
| `src/components/layout/WorkspaceHeader.tsx`| 79 | **C (Re-audited)** | **Retain**: Re-integrated into `DockedLayout.tsx`. |

---

## 5. Six-Phase Execution Specifications

### Phase 0: Close Part A Cleanup
- **Target Files**: `GoogleEarthRemix.css`, `SpaceHudPillControls.tsx`
- **Action**: Confirm zero residual `.orbital-hud-*` rules remain in CSS.
- **Verification**: `npm run qa:check`.

### Phase 1: Local WWV Asset Pipeline
- **Target Files**: `scripts/sync_wwv_assets.cjs` [NEW], `package.json`, `repositoryData.ts`, `parseWwvManifest.ts`
- **Action**: Mirror `worldwideview/public` into `public/wwv-assets/` and wire `parseWwvManifest.ts`.
- **Verification**: Disconnect network in dev mode; verify offline loading of borders, cameras, military bases, and TLE datasets.

### Phase 2: Terrain-Aligned Static Landmarks
- **Target Files**: `useLandmarks.ts`, `locations.ts`
- **Action**: Add `HeightReference.CLAMP_TO_GROUND` to static landmark points/labels in `useLandmarks.ts`.
- **Verification**: Enable 3D terrain and verify ground alignment.

### Phase 3: Store Ownership & Migration Boundary
- **Target Files**: `uiStore.ts`, `store.ts`
- **Action**: Map `uiStore.ts` (UI/layout) vs `store.ts` (domain state).
- **Verification**: `npm test`.

### Phase 4: Component Decomposition
- **Target Files**: `GoogleEarthRemix.tsx`, `WorldWideTelescopeView.tsx`
- **Action**: Modularize views, canvas fallbacks, and control drawers.
- **Verification**: `npm run typecheck`.

### Phase 5: Lint Scope & Remediation
- **Target Files**: `.eslintrc.cjs`
- **Action**: Exclude subprojects (`worldwideview/**`) and resolve root app lint errors.
- **Verification**: `npm run lint`.

### Phase 6: Runtime & Bundle Performance
- **Target Files**: `scripts/perf-check.mjs`, `vite.config.ts`
- **Action**: Profile Bridge integration and configure Vite vendor chunk splitting.
- **Verification**: `npm run perf:check` and `npm run build`.
