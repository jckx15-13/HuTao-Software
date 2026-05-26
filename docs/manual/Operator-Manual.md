# Silver Wolf VI - Operator & Developer Manual
## Premium AI-Spatial Cybernetic Workspace

Welcome to the **Silver Wolf VI** Operator and Developer Manual. This document serves as the comprehensive repository of knowledge for the design, architecture, reverse engineering, and day-to-day operation of the Silver Wolf VI spatial dashboard.

---

## 1. Concept & Visual Aesthetics
Silver Wolf VI is modeled as a premium, AI-native cybernetic workstation. The visual design is heavily inspired by **Honkai: Star Rail** (specifically the character Silver Wolf's hacking aesthetic) and features a high-density, neon-cyberpunk user interface.

### Design Elements
- **Color Palette:** Tailored deep space gradients, cool cyan highlights (`#00FFFF`), and Honkai-inspired purples (`#8A5BC7`).
- **Glassmorphism:** Translucent panel backdrops with dynamic blur (`backdrop-filter: blur(16px)`), solid/glow borders, and customizable card opacity.
- **Dynamic Animations:** Micro-animations for buttons, breathing glow pulses for active operations, and smooth slide-in/out transitions between primary views.
- **Atmospheric Rendering:** Real-time day/night sunlight cycle, glowing atmospheric horizons, and dynamic starfields.

---

## 2. System Architecture

Silver Wolf VI integrates a three-way space-shell workspace:

```mermaid
graph TD
    UI[Zustand Store: uiStore] -->|Triggers view transition| CP[CenterPanel]
    CP -->|Slide animation| Chat[Chat Interface]
    CP -->|Slide animation| Orbital[Orbital View]
    CP -->|Slide animation| Telescope[Telescope View]
    
    Orbital -->|Renders overlay controls| GER[GoogleEarthRemix UI]
    Orbital -->|Background rendering| Cesium[CesiumBackground3D]
    Telescope -->|Embedded astronomy client| WWT[WorldWide Telescope Web Client]
    
    Cesium -->|Renders 3D Country Borders| useBorders
    Cesium -->|OSM 3D Buildings & Tiles| useImageryManager
    Cesium -->|Camera Flights| useCameraActions
    Cesium -->|Bridge to WWV Plugins| useWWVGlobe
    
    useWWVGlobe -->|Dynamic 3D Hexagons| useHexagonRendering
    useWWVGlobe -->|Airplane Trails| useTrailRendering
    useWWVGlobe -->|Close-range glTF models| useModelRendering
    useWWVGlobe -->|Satellite sensor frustum| useSatelliteFrustum
```

### Key Technical Subsystems:
1. **Zustand State Store (`uiStore.ts`):** Coordinates primary view mode switching (`chat` vs `orbital` vs `telescope`), panel expansions, graphics settings (borders, terrain, shadows, resolution scale, anti-aliasing), panel transition styles (`slide`, `swing-3d`, `fade`), and active selections.
2. **Cesium 3D Globe Viewer (`CesiumBackground3D.tsx`):** Renders the WGS84 planetary base layer using WebGL2. 
3. **WorldWide Telescope Viewport (`WorldWideTelescopeView.tsx`):** Embeds the astronomical WWT client via deep-linked coordinates and a glass-morphic controller.
4. **DataBus Event Pipeline (`DataBus.ts`):** Allows loose coupling between plugins, UI buttons, and Cesium camera animations via publish/subscribe event channels (e.g., `cameraGoTo`, `cameraFaceTowards`).
5. **WWV Plugin Ingestion SDK (`wwv-sdk/`):** Standardizes real-time entity streams (such as USGS Earthquakes and ISS tracking telemetry) for automatic rendering.

---

## 3. Project Timelines & Prompt Evolution
Silver Wolf VI evolved through a sequence of design and engineering iterations:

1. **Phase 1: Foundation & Theming:** Initial layout creation for a three-panel dashboard adopting a cyberpunk theme.
2. **Phase 2: Fallback 2D Globe & Physics:** Creation of the canvas 2D vector fallback globe to run physics calculations and trajectory rendering without WebGL dependencies.
3. **Phase 3: WorldwideView SDK Integration:** Translation of the WorldWideView (WWV) plugin SDK to support ingestion pipelines (planes, satellites, earthquakes) inside the React stack.
4. **Phase 4: Optimization & LOD:** Implementing level-of-detail rendering for close-range glTF models (like airplanes) and camera-altitude-based dynamic clustering to preserve thread performance.
5. **Phase 5: Orbital View & Features Activation:** Renaming the layout to **Orbital View**, centering and raising the mode switcher (`z-30`), removing meridian/parallel lines to clear CRT scanlines, and wiring the borders, imagery, trails, satellite sensor cones, and 3D hexagonal seismic markers.
6. **Phase 6: Celestial Telescope Integration & Transition Dynamics:** Integrating the WorldWide Telescope (WWT) web client as a dedicated "Telescope View" in the mode switcher, featuring pre-loaded coordinates for nebulae and planets. Implementing customizable 3D swinging and fading side panel transitions under personalization settings, and resolving OSM fallback layer runtime issues to ensure robust offline/default rendering.

---

## 4. Operator Guide (How to Use)

### Primary View Selection
Toggle between **Chat View** (to prompt your AI companion), **Orbital View** (to inspect the 3D globe), and **Telescope View** (to point the celestial array) using the capsule-shaped switcher pill centered at the very top of the center panel.

### Navigation & Camera Controls
- **Rotate Globe:** Left-click and drag the globe to turn it.
- **Tilt Camera:** Right-click/middle-click and drag, or hold `Ctrl` + drag, to tilt and change pitch/yaw.
- **Zoom In/Out:** Use the scroll wheel or the floating `+` and `-` buttons in the bottom-right control cluster.
- **Reset Heading (North up):** Click the Compass button to orient North to the top.
- **Recenter:** Click the navigation chevron icon to return the camera focus to the active target.

### Search Panel
Search for static cities, monuments, or active entities (like the ISS) in the Left Sidebar's Search input. Clicking a result will lock the target and fly the camera smoothly to its position.

### Graphics Presets
Open the Left Sidebar's **Map Style** (layers) tab to control visual details:
- **Performance Mode:** Minimizes graphics for low-end systems (disables shadows/MSAA, lowers resolution scale to 0.7x, hides 3D buildings).
- **Cinematic Mode:** Maximizes graphics for high-end systems (enables shadows, 1.0x resolution scale, MSAA 4x, and load 3D OSM buildings).

### Measurement Ruler
Use the **Measure** tool in the Left Sidebar to compute the geodetic distance (great-circle path) between a Start and End landmark. The path will be drawn as a blue geodetic line.

### Telescope View (WorldWide Telescope Array)
Point the workspace array at deep space objects or planets using the **Telescope** switcher tab:
- **Navigation:** Click and drag the viewport to pan the celestial sphere; use the scroll wheel to zoom.
- **Star Array Presets:** Point the telescope instantly at preloaded cosmic structures:
  - *Deep Sky Survey:* Comprehensive panoramic sky map.
  - *Andromeda Galaxy (M31):* Fly to the closest major spiral galaxy.
  - *Orion Nebula (M42):* Zoom in on active stellar nurseries.
  - *Pillars of Creation (M16):* Luminous gas pillars imaged by Hubble and JWST.
  - *Crab Nebula (M1):* High-detail supernova remnant.
  - *Planet Mars / Jupiter:* Rotate orthographic surface scans and orbital paths of Solar System targets.
- **Telemetry Indicators:** Monitor real-time Right Ascension (RA), Declination (DEC), and Field of View (FOV) on the glass-morphic controller panel.

---

## 5. Developer Guide (Reverse Engineering)

### Directory Map
- `src/components/panels/CenterPanel.tsx`: Orchestrates the slide transitions between the Chat view container and the Orbital view container.
- `src/components/background/CesiumBackground3D.tsx`: Spawns the Cesium canvas and wires up hooks.
- `src/core/globe/hooks/useHexagonRendering.ts`: Custom hook drawing 3D hexagons for earthquakes.
- `src/core/globe/hooks/useSatelliteFrustum.ts`: Renders the conical frustum under selected satellites.
- `src/core/globe/useBorders.ts`: Batches country boundaries into a single WebGL primitive draw call to maintain high frame rates.
- `src/plugins/earthquakes/EarthquakesPlugin.ts`: Ingests USGS feeds and maps magnitude to proportional 3D hexagon geometries.

### Creating a Custom Ingestion Plugin
To add a new data layer, create a class implementing the `WorldPlugin` interface:
```typescript
import type { WorldPlugin, GeoEntity, CesiumEntityOptions } from "@/core/plugins/PluginTypes";

export class CustomSatelitePlugin implements WorldPlugin {
    readonly id = "my-custom-plugin";
    readonly name = "Custom Satellites";
    readonly version = "1.0.0";

    async fetch(): Promise<GeoEntity[]> {
        // Fetch and map your custom API data to WGS84 coordinates
        return [{
            id: "sat-1",
            pluginId: this.id,
            latitude: 37.7749,
            longitude: -122.4194,
            altitude: 350000,
            timestamp: new Date(),
            properties: { speed: 7.8 }
        }];
    }

    renderEntity(entity: GeoEntity): CesiumEntityOptions {
        return {
            type: "model",
            modelUrl: "/satellite/scene.gltf",
            modelScale: 2.0,
            labelText: "Custom Sat-1"
        };
    }
}
```

---

## 6. Workspace Artifact Gallery

Below are visual captures of the system's operational interface states:

![Operational Workspace View](/C:/Users/jaron/.gemini/antigravity/brain/154cd011-440e-41ae-81b3-ed3ccdcc4bf9/media__1779455906312.png)
*Figure 1: Cyberpunk Workspace Panel Layout*

![High Detail Planetary Base Layer](/C:/Users/jaron/.gemini/antigravity/brain/154cd011-440e-41ae-81b3-ed3ccdcc4bf9/media__1779455906325.png)
*Figure 2: Cesium 3D Globe with Atmosphere Lighting*

![3D Hexagon Column Geometry](/C:/Users/jaron/.gemini/antigravity/brain/154cd011-440e-41ae-81b3-ed3ccdcc4bf9/media__1779455924864.jpg)
*Figure 3: Global Earthquake Magnitude Columns*
### Wisdom Block 1
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 2
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 3
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 4
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 5
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 6
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 7
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 8
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 9
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 10
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

### Wisdom Block 11
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 12
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 13
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 14
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 15
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 16
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 17
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 18
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 19
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 20
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

### Wisdom Block 21
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 22
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 23
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 24
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 25
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 26
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 27
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 28
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 29
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 30
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

### Wisdom Block 31
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 32
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 33
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 34
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 35
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 36
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 37
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 38
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 39
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 40
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

### Wisdom Block 41
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 42
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 43
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 44
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 45
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 46
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 47
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 48
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 49
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 50
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

### Wisdom Block 51
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 52
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 53
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 54
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 55
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 56
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 57
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 58
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 59
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 60
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

### Wisdom Block 61
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 62
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 63
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 64
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 65
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 66
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 67
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 68
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 69
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 70
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

### Wisdom Block 71
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 72
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 73
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 74
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 75
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 76
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 77
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 78
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 79
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 80
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

### Wisdom Block 81
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 82
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 83
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 84
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 85
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 86
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 87
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 88
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 89
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 90
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

### Wisdom Block 91
- When explanation is the goal, start with the thing the maintainer can verify immediately.
- Then move to the layer that owns the failure.
- Then name the next least expensive check.
- Then name the first reversible fix.
- Then name the evidence that proves the fix worked.
- This keeps repair work bounded.
- It also keeps the narrative honest.
- It reduces speculative churn.
- It makes the document actionable.
- It preserves trust in the manual.

### Wisdom Block 92
- Animation is useful when it clarifies state change.
- It is not useful when it hides uncertainty.
- Use motion to show transition, not to decorate absence.
- Give reduced-motion users a clear equivalent.
- Make errors quieter in motion but louder in meaning.
- Keep the semantics ahead of the spectacle.
- Prefer one meaningful transition over many incidental ones.
- Staggered reveal can replace abrupt visual overload.
- Stateful motion should map to actual application state.
- If motion cannot be described, it is probably ornamental.

### Wisdom Block 93
- Semiotic diversity helps readers who think in different registers.
- Symbols compress state into names and commands.
- Indexes point to evidence and consequences.
- Icons resemble the thing they represent.
- Procedures teach sequence.
- Matrices teach comparison.
- Timelines teach history.
- Narratives teach causality.
- Maps teach structure.
- A strong manual can use all of them.

### Wisdom Block 94
- A theoretical lens is valuable only if it changes action.
- Systems theory suggests dependencies can amplify small failures.
- Cognitive load theory suggests summaries must stay small.
- Resilience engineering suggests failures should be containable.
- Information theory suggests repeated noise lowers value.
- Affordance theory suggests labels should promise what controls actually do.
- Failure-mode thinking suggests every layer needs a named failure path.
- Sociotechnical thinking reminds us that documentation is part of the system.
- A theory that does not change the checklist is just vocabulary.
- The best theory shortens debugging time.

### Wisdom Block 95
- Maintenance wisdom starts with boundaries.
- Name the active path.
- Name the archived path.
- Name the experimental path.
- Name the risky path.
- Then keep those categories stable.
- Moving files without updating labels creates false confidence.
- Renaming a manual is a governance act, not just a cosmetic one.
- A shorter top-level guide usually helps orientation.
- A longer deep manual usually helps repair and study.

### Wisdom Block 96
- A good incident note answers four questions.
- What failed.
- Where it failed.
- Why the first fix is chosen.
- How success will be measured.
- If any one of those is missing, the note is weaker.
- If all four are present, recovery speeds up.
- This structure works for startup, build, and runtime faults.
- It also works for dependency upgrades.
- It scales better than prose alone.

### Wisdom Block 97
- Visible debt is better than hidden debt.
- A documented blocker can be tracked.
- An undocumented blocker can recur.
- A stale dependency can be scheduled.
- An unlabeled archive can be mistaken for active code.
- An explicit note is usually cheaper than a surprise.
- The manual should therefore over-communicate ownership.
- It should under-claim certainty.
- It should prefer measurable status over vague reassurance.
- That discipline keeps the docs useful.

### Wisdom Block 98
- When the repo contains multiple ecosystems, the manual should show the seams.
- Frontend and bridge do not fail for the same reasons.
- Archived code should not be read as current policy.
- Experimental code should be labeled as such.
- Operational scripts deserve their own runbook notes.
- The maintainer needs to know which commands are authoritative.
- The manual can lower risk by naming those boundaries repeatedly.
- That repetition is not wasteful if the repository is complex.
- It is a reminder that the system is layered.
- Layered systems demand layered documentation.

### Wisdom Block 99
- The best README is a map, not a maze.
- The best manual is a map with contour lines.
- The contour lines are failure paths, repair steps, and evidence trails.
- The map should not pretend that all paths are equally important.
- The primary path deserves the shortest route.
- The recovery path deserves the clearest route.
- The archival path deserves the strongest label.
- The experimental path deserves the most caution.
- The map should support action, not just description.
- A good map reduces avoidable wandering.

### Wisdom Block 100
- A reliable explanation ladder has three rungs.
- First: a one-paragraph summary.
- Second: a procedural user guide.
- Third: a deep manual with theory and repair notes.
- Each rung serves a different attention budget.
- Each rung should stand alone.
- Each rung should link downward or upward cleanly.
- No rung should rely on the reader guessing the next one.
- This is especially important after a large rewrite.
- Structure is part of reliability.

