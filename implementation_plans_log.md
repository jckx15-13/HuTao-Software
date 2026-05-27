# Project Management - Implementation Plans Log

This file acts as a historical log of all implementation plans drafted and executed during the development of Silver Wolf VI. This provides project tracking, versioned design history, and audit compliance.

---

## [Plan V1.0] Telescope Onion Blend, Developer Diagnostics, and Satellite Features (2026-05-27)

### Status: Approved & In Progress

### Goal Description
We will merge telescope view with the background orbital celestial presets, restore the settings page opacity/translucency controls, fix imagery loading, introduce a developer diagnostics view with event logging and fallback controls, and import comprehensive satellite tracking and 3D hexagon feeds based on WorldWideView logic.

### User Review Required

> [!IMPORTANT]
> - **Telescope Onion Design & UI Integration:** The Cesium background remains active in telescope mode. We will combine Telescope View with Orbit View, drawing UI inspiration from WorldWideView to prevent clutter. The high-resolution WWT iframe will render cohesively with the orbital background.
> - **Satellite Tracking & 3D Hexagons:** We will copy and translate logic from the WorldWideView project to import *all* satellites, displaying their spatial position tracking. We will also implement 3D visualization feeds via 3D hexagons.
> - **Settings Page Restoration:** The Settings page will be restored to its initial glory from project history, featuring more customization (translucency slider) and extensive developer tools.
> - **Imagery Providers:** We will fix the graphics imagery source not loading by adding an Imagery Provider selector supporting Bing, Google, OpenStreetMap, and Cesium Ion.
> - **References & Cross-Checking:** During execution, the agent must navigate to the live demo at `https://demo.worldwideview.dev/` using the browser devtools MCP server to inspect the running UI, retrieve codebase references, and cross-check the satellite/hexagon tracking interface against the local implementation. We will also cross-check with the local `worldwideview` workspace (`c:\Users\jaron\OneDrive - Ministry of Education (M365 T&L)\Documents\worldwideview`).

### Proposed Changes

---

#### 1. State Management & Core Data Routing

##### [MODIFY] [uiStore.ts](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20(M365%20T&L)/Documents/silver-wolf-vi/src/store/uiStore.ts)
- Add `forceFallback: boolean` state variable (default: `false`).
- Add `engineUrlOverride: string` state variable (default: `""`).
- Add `imageryProvider: string` state variable (default: `'cesium'`).
- Add `setForceFallback`, `setEngineUrlOverride`, and `setImageryProvider` actions.
- Include them in Zustand persisted state list.

##### [MODIFY] [resolveEngineUrl.ts](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20(M365%20T&L)/Documents/silver-wolf-vi/src/core/data/resolveEngineUrl.ts)
- Read `engineUrlOverride` from `useUIStore.getState()`.
- If set, normalize it via `toWsStreamUrl` and return it to route REST and WS requests.

---

#### 2. Telescope View and Globe Blending (WorldWideView UI)

##### [MODIFY] [App.tsx](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20(M365%20T&L)/Documents/silver-wolf-vi/src/App.tsx)
- Pass `interactive={interactionMode === 'orbital' || interactionMode === 'telescope'}` to `<CesiumBackground />`.
- Update the dark backdrop-blur overlay condition so Cesium celestial projections are fully visible.
- Re-enable custom cursor component and navigation.

##### [MODIFY] [WorldWideTelescopeView.tsx](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20(M365%20T&L)/Documents/silver-wolf-vi/src/components/learning/WorldWideTelescopeView.tsx)
- Use a less cluttered UI approach inspired by WorldWideView.
- Change the outer page wrapper to `bg-transparent select-none pointer-events-none`.
- Remove full-screen viewport black backgrounds.
- Render the high-resolution WWT iframe inside a draggable, floating, glassmorphic Picture-in-Picture window overlay.

---

#### 3. Satellites, Hexagons & Fallback Rendering

##### [NEW] `src/core/satellites/` and `src/core/hexagons/`
- Import all satellite propagation logic and TLE fetching code from `worldwideview`.
- Implement spatial satellite position tracking.
- Add components for rendering 3D hexagon visualization feeds based on spatial data.

##### [MODIFY] [CesiumBackground.tsx](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20(M365%20T&L)/Documents/silver-wolf-vi/src/components/background/CesiumBackground.tsx)
- Integrate the new Imagery Provider selector (Bing, Google, OpenStreetMap, Cesium Ion).
- Pull `forceFallback` from UI store.
- Include `forceFallback` in `hasError` conditions.
- Implement rendering of all imported satellites and their orbital paths on both the Cesium globe and the 2D vector fallback globe.
- Render 3D hexagon data layers.

---

#### 4. Settings Page Restoration & Developer Diagnostics Panel

##### [MODIFY] [DataBus.ts](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20(M365%20T&L)/Documents/silver-wolf-vi/src/core/data/DataBus.ts)
- Define a public in-memory array `history` containing the last 50 events.

##### [MODIFY] `src/components/settings/SettingsPage.tsx`
- Restore the Settings page based on Git history.
- Integrate the translucency settings (slider controlling `personalisation.panelOpacity`).
- Re-apply `.glass-panel` utilities to side panels for a premium translucent UI.
- Ensure the CRT scanline toggle and imagery provider selector are included.

##### [NEW] [DeveloperSettings.tsx](file:///c:/Users/jaron/OneDrive%20-%20Ministry%20of%20Education%20(M365%20T&L)/Documents/silver-wolf-vi/src/components/settings/DeveloperSettings.tsx)
- Build the Dev Settings view containing:
  - Checkbox toggle for `forceFallback`.
  - Input field for `engineUrlOverride`.
  - Plugin registry table listing all registered plugins.
  - Live DataBus Event Log table.
  - State copy-to-clipboard button.

---

### Verification Plan

#### Automated Tests
- Run `tsc --noEmit` to verify complete compile-time TypeScript type safety.
- Verify production build completes successfully via `npm run build`.

#### Manual Verification Checklist (Inclusive Testing)
> [!TIP]
> We will rigorously click every element to see what is working and what is not.

- [ ] **Inclusive UI Testing:** Click every button, tab, and slider in the Settings page and main UI. Verify hover states, selection states, and transitions work flawlessly.
- [ ] **Telescope & Orbit Blend:** Switch between Orbital and Telescope modes. Verify WWT PiP overlay exists, stars are visible, and UI is uncluttered.
- [ ] **Satellite Tracking:** Zoom in/out of the globe. Ensure spatial satellite positions (multiple satellites) are updating continuously along their orbits.
- [ ] **3D Hexagons:** Verify hexagon visualization layer renders correctly over the globe.
- [ ] **Settings Restoration:** Adjust the translucency slider and toggle CRT scanlines. Verify real-time application to `.glass-panel` elements. Check that the developer tab exists and logs events.
- [ ] **Imagery Providers:** Switch between Bing, Google, OSM, and Cesium Ion. Verify the globe imagery updates without reloading.
- [ ] **Custom Cursor:** Verify the custom cursor is responsive and visible across all states.
