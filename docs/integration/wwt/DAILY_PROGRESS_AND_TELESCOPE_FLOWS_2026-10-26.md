# Silver Wolf VI — daily progress and telescope integration

**Report date:** 26 October 2026, Asia/Singapore
**Audience:** product owner, design and implementation contributors
**Status:** research and working prototype; unified world-view integration remains incomplete
**Scope:** the four available Silver Wolf VI Codex chats active today, current local source, existing research artifacts, and relevant connected Notion evidence. This is a dated snapshot of a shared, uncommitted working tree.

## 1. Executive summary

Today’s work covered design documentation, WWT imagery and camera research, an astronomy prototype, globe/UI fixes, integration-status cleanup, a performance assessment, and a Git history/diff review. The current app has a Telescope entry and a camera pullback, while a separate experimental route contains additional WWT and Python astronomy functionality. These pieces have **not yet become the continuous world-view experience you requested**. Your latest requirement is the controlling design direction: Telescope extends the existing world view, unlocks additional ways to look around and explore, and retains Silver Wolf VI’s interface. Turning behind the observer must reveal the sky in that direction, with celestial overlays registered to the sky rather than stuck to the screen. The next implementation milestone is a shared camera and scene contract connecting those capabilities to the existing view, followed by visual verification of the complete journey.

### In everyday terms

You begin looking at Earth in the familiar world view. Switching to Telescope gives that same view astronomy controls and the freedom to turn away from Earth, look behind yourself, inspect planets and asteroids, or look into deep space. You do not have to open a new Observatory application. Stars and constellations surround your viewpoint: moving your gaze changes which ones you see. Returning to Space should take you back to your previous Earth-view position and direction.

**That is the intended experience. The present implementation only delivers parts of it.**

## 2. What was done today across the available chats

The following combines four project chats rather than attributing all changes to this conversation. “Reported check” means a check recorded in the relevant chat; it is not a new verification of every subsequent shared edit.

| Workstream | Work recorded today | Result and limits |
|---|---|---|
| Design and documentation [C1] | Reviewed the app and design documentation; produced a design audit and WWT integration preparation; compiled the detailed camera, media, catalog, storage and design report. | Research artifacts exist, including Markdown and a formatted Word report. Research completion does not establish implementation completion. |
| WWT media research [C1] | Saved catalog metadata, an imageset inventory, measured tile samples and storage calculations. | The saved inventory contains 4,169 imageset definitions. It is a metadata inventory, not a complete downloaded image library or a measured total of all WWT storage. |
| Astronomy prototype [C1] | Added a WWT engine canvas, constellation catalog loading, observer/time controls, a Python astronomy API, a solar-system diagram, and a Bennu model-loading path. | Code exists under an experimental Observatory route. Early engine/API checks succeeded; full visual behavior and integration into the existing world view remain unverified. |
| Product direction [C1] | Clarified spherical rendering for the Sun and planets, real asteroid geometry where available, and integration over the existing world view. | A separate full-page Observatory experience was rejected as the final interaction model. The experimental route still exists in source. |
| Codebase and repository review [C2] | Created the codebase review; corrected misleading integration wording; distinguished repository/source evidence from runtime evidence; identified incomplete plugin, seeder and data-engine wiring. | Integration remains partial and conditional. TypeScript strict mode was already enabled; it was not newly introduced today. |
| Globe and interface fixes [C2] | Added/refined Telescope switching and camera pullback; fixed the three-button mode pill; added a typed Cesium viewer registry; revised source-list presentation; changed hexagon rendering to retain and update objects. | Browser checks in that chat observed a working Earth globe, imagery, markers and mode switching. Temporal proof that flicker is eliminated was not established. |
| Reliability and naming [C2] | Replaced misleading runtime-mode naming with a shared helper; improved viewer-reference cleanup; retained failure/retry handling for the legacy WWT connection. | The legacy WWT connection still showed unavailable/connection-failure behavior during recorded checks. A working globe does not imply a working WWT feed. |
| Performance [C3] | Planned measurement-led optimization without deleting unfinished features; ran the performance checker; documented the limits of older performance claims. | The checker scanned 198 existing JS/CSS assets. Frontend and bridge runtime measurements had zero samples because the services were unavailable at that check. |
| Git comparison [C4] | Identified the nested Git repository, reviewed changes and cached history, attempted remote comparison. | Remote fetch failed due to DNS during that chat. Comparisons used cached refs, not confirmed current GitHub state. |

### Concrete outputs

- [Design audit folder](../../design-audit-2026-10-26/).
- [Codebase and integration review](../../CODEBASE_REVIEW_2026-10-26.md).
- [Integration preparation](../../WWT_INTEGRATION_PREPARATION.md).
- [WWT design and media report](WWT_DESIGN_AND_MEDIA_REPORT.md) and [Word version](WWT_DESIGN_AND_MEDIA_REPORT.docx).
- [WWT source index](SOURCE_INDEX.md), [imageset inventory](research/imageset-inventory.csv), [tile measurements](research/tile-samples.json), and [storage estimates](research/storage-estimates.csv).
- [Performance record](../../../PERFORMANCE.md).

### Repository position

The current branch is `prototype/wwt-online-observatory`. The inspected HEAD is `00f0c0c3`, dated **27 August 2026**, so it must not be described as a commit made today. Today’s work is present as local modifications and untracked files across the shared checkout. The earlier Git-review counts describe an earlier snapshot, not the current total. No publication or merge is established by this report.

## 3. Current position of the WWT project

### Keep these systems distinct

- **Silver Wolf VI:** the host interface, interaction state, panels and application workflows.
- **WorldWideView / WWV:** the globe/data/plugin integration and related repository work.
- **WorldWide Telescope / WWT:** astronomical sky imagery, catalogs and rendering capabilities.
- **Python astronomy service:** time, observer and celestial-position calculations for the new prototype.

Similar names have contributed to documentation confusion. A WWV repository check passing is not evidence that WWT imagery loads or that an astronomy camera is correct. [C2]

| Capability | Current evidence | Delivery state |
|---|---|---|
| Existing world view and Telescope control | Current `CenterPanel` and recorded globe Browser checks | Present |
| Pull back from Earth on entry | Current source preserves longitude/latitude and orientation while increasing height | Present, but not free-look integration |
| Legacy telescope interface | Existing `WorldWideTelescopeView`, including legacy connection behavior | Present; connection reliability unresolved |
| Native WWT engine experiment | `WWTCanvas.tsx`, exposed through `?view=observatory` | Prototype; separate from the accepted journey |
| Astronomy API | `/api/astronomy/scene` and `/api/astronomy/constellations` | Implemented prototype; responses checked earlier |
| All 88 constellation names/regions | WWT region-centroid catalog grouped into 88 entries, including two Serpens regions | Catalog support; not proof of complete native geometry |
| Sun/planet representations and Bennu model path | `SpatialView.tsx` | Prototype; not established in the continuous world scene |
| Shared time, observer and actual live camera | Separate prototype state and existing app state | Incomplete |
| Turn behind the observer in the world view | Required by the latest request | Not verified as implemented |
| Full constellation surroundings in the world view | Existing Cesium overlays plus separate WWT capabilities | Incomplete; camera/frame correctness needs work |
| Offline media library | Research and estimates | Not delivered; online prototype is the current implementation scope |

The Developer Panel’s integration percentages are **evidence coverage**, not percentage completion of WWT. The review recorded expected coverage of 50% for core and 75% for each of WWV and data engine/seeders, based on four checks each. Live bridge evidence was missing at the time; these numbers should not be used as a release-readiness score. [C2]

## 4. What currently happens when Telescope is selected

This section describes inspected code, not the proposed finished flow. See [CenterPanel](../../../src/components/panels/CenterPanel.tsx).

1. Telescope interaction state becomes active.
2. The current Earth-view height is saved when entering from outside Telescope.
3. The Cesium camera flies to the same geographic longitude and latitude, keeping its current heading, pitch and roll.
4. Its destination height is `max(currentHeight × 1.8, 24,000,000 metres)`; the animation duration is 1.25 seconds.
5. The existing world-view composition exposes telescope controls. This does not automatically connect the separate Observatory renderer or establish a free camera.
6. Returning to Space uses the saved height; if unavailable, it uses `min(currentHeight / 1.8, 12,000,000 metres)`.
7. Escape first closes an open mode switcher. Otherwise, in Telescope, it returns to the Earth/orbital state.

**Important gap:** only the previous height is saved by this mechanism. It does not save and restore the complete original position, orientation, target and field of view. A pullback also changes position without necessarily changing what the user is looking toward. Neither behavior alone fulfills “look behind me.”

## 5. Intended end-to-end user flows

The following is the recommended implementation specification derived from your latest requirements. These flows are not a claim that they all work today.

### A. Enter Telescope from the world view

1. The user selects **Telescope** in the existing mode switcher.
2. Save the full Earth-view camera pose, projection/FOV, selected target and relevant layer settings.
3. Keep the world scene and familiar Silver Wolf panels visible. Reveal astronomy controls over that scene.
4. Release the Earth-centered look constraint and enable a clear **Look around** interaction. Preserve orientation through the transition so the user understands where they are.
5. Load astronomy catalogs and imagery with distinct loading, partial and failed states. The mode can be active before every tile is ready; the interface must communicate that distinction.
6. Offer the additional viewing modes below. “Unlocked” means available within Telescope, not an account permission or subscription gate.

### B. Look around, including behind the camera

Dragging in Look around rotates the view at the current camera position. A 180-degree turn reveals the opposite direction; it does not teleport the observer to the other side of Earth. A compass/orientation indicator and **Face Earth** or **Reset orientation** control help the user recover context. Zoom in this mode changes angular field of view, with a visible FOV value; it should not silently move the camera through space.

If Earth lies between the camera and a target, Earth should occlude that target in the physical view. An optional educational reveal-through-Earth setting must be explicitly labeled as a schematic display. Ground-observer mode should explain below-horizon targets rather than treating them as missing data.

### C. Search for a constellation or deep-sky target

1. Open the compact celestial search/catalog overlay.
2. Search by name; show all 88 constellation entries, with Serpens handled as one constellation with two regions.
3. Selecting a constellation slews the view toward its region and fits an appropriate angular extent. Selecting a galaxy or nebula centers that target.
4. Keep line figures, boundaries, labels and artwork as separate toggles. A boundary region and a familiar star-line drawing are different information.
5. Keep the selected target visible in the inspector with its coordinates and imagery source. If imagery is still loading, retain the target and show that status.

This flow must extend beyond a planet-only selector. Deep-sky exploration primarily uses angular navigation and survey imagery; a flat survey image does not provide the geometry for flying around a galaxy in 3D.

### D. Inspect a body

Select the Sun, a planet or moon, then choose **Observe** or **Orbit body**. Observe points the existing camera at the object; Orbit body deliberately moves the camera into a target-centered navigation mode. The distinction prevents an unexpected jump when merely selecting a target.

Render the Sun and planets as spheres with appropriate imagery/materials. The Sun should have an emitting appearance; planetary illumination should follow the Sun direction where supported. Venus should use a clearly identified visible/cloud or radar/surface dataset rather than implying these are the same appearance. For asteroids, use a documented 3D shape model when available. If one is unavailable, disclose that fact rather than substituting an invented detailed shape. The Bennu loader is a starting point, not evidence of a complete asteroid catalog or orbit solution.

### E. Change viewing mode inside Telescope

| Mode | User purpose | Camera behavior | Main display |
|---|---|---|---|
| Look around / Sky | See the surrounding sky, including behind | Rotate at current observer position; angular zoom | Registered stars, survey imagery and constellation overlays |
| Orbit body | Inspect a selected Sun/planet/moon/asteroid | Orbit a named target; explicit distance control | Sphere or documented shape model |
| Solar system | Understand relative positions or travel between bodies | Explicit translation/orbit in a shared spatial frame | Bodies, optional paths and distance cues |
| Deep sky | Explore nebulae, galaxies and surveys | Point and change angular field of view | Survey imagery and catalog objects |
| Observer context | Understand where the viewing camera is | Separate inspection camera looks at the viewing camera | Optional small diagram/inset or in-place aid |

These are Silver Wolf interaction modes; they need not map one-to-one to WWT’s render-type names. WWT’s choice of background can itself change render type, so imagery selection must be coordinated with the active mode. Its documentation distinguishes sky, planet, Earth, panorama and solar-system rendering. [WWT render types](https://docs.worldwidetelescope.org/webgl-reference/latest/tutorial/change-bg/)

### F. Change time, observer or imagery

Use one shared simulation time for Earth orientation, solar-system positions and sky overlays. Changing observer latitude/longitude/altitude recalculates local visibility and direction. Display whether time is live, paused or a selected date. Keep the active survey and its attribution visible; astronomical survey imagery should not be labeled a live camera feed unless that particular source actually provides one.

Switching surveys preserves the target and intended orientation. WWT downloads image tiles as needed, so transitions can have partial imagery. Keep a loading indication and avoid reporting a blank patch as “no object.” [WWT imagery loading](https://docs.worldwidetelescope.org/webgl-reference/latest/tutorial/change-bg/)

### G. Exit or recover from failure

Returning to **Space** restores the full saved Earth-view pose and the previous navigation constraints. Close the topmost open menu/dialog before applying Escape to exit the mode. A failed astronomy service or imagery source should show which component failed, retain the last usable scene where possible, and offer retry. The user should still be able to return to Space.

## 6. Where the camera and constellations belong

### Plain-language explanation

The camera has both a **place** and a **direction**. Turning your head changes direction; walking changes place. Telescope needs both operations, with clear controls, rather than treating every action as Earth zoom.

Constellations form an all-sky reference around the observer. They should remain anchored to celestial directions while the camera turns. They must not rotate along with the camera like a sticker on the screen. Stars within a constellation are generally at different distances: the constellation is a region/pattern seen from our vicinity, not a physical object with all stars on one nearby surface. The IAU defines 88 regions covering the sky. [IAU constellation reference](https://iauarchive.eso.org/public/themes/constellations/)

```text
             distant sky / constellation directions
        .---------------------------------------------.
       /              target galaxy                    \
      |                    ↑ gaze                       |
      |    Sun ○       Earth ○  camera C → current view |
      |         Venus ○          ← after turning 180°   |
      |                           asteroid ◇            |
       \                                               /
        '---------------------------------------------'

Conceptual diagram only: positions and object sizes are not to scale.
Turning changes the gaze arrow. Travelling changes the position of C.
The surrounding sky is not a nearby physical shell.
```

### Technical contract

Choose an explicit inertial frame and epoch for astronomical quantities. Convert Earth-fixed coordinates through a time-dependent transform; do not directly add Earth-fixed vectors to inertial solar-system positions.

For a geometric visualization with consistent axes and units:

```text
C(t) = E(t) + R_EarthFixed→Inertial(t) · o_EarthFixed
bodyRelativeToCamera(t) = B(t) − C(t)
lookDirectionToBody(t) = normalize(B(t) − C(t))
```

`E` is Earth’s position, `C` the camera position, `o` the Earth-relative observer offset, and `B` the selected body position. An arbitrary free-flight camera needs its own inertial position instead of being constrained to an Earth-surface observer. Apparent observations need the appropriate coordinate/light-time treatment in addition to this geometric diagram. Astropy supplies barycentric body positions and observer coordinate tools; the current prototype uses these for visualization. [Astropy body positions](https://docs.astropy.org/en/stable/api/astropy.coordinates.get_body_barycentric.html), [EarthLocation](https://docs.astropy.org/en/latest/api/astropy.coordinates.EarthLocation.html)

For a celestial right ascension `α` and declination `δ` in radians:

```text
n = (cos δ cos α, cos δ sin α, sin δ)
n_camera = transpose(R_camera→celestial) · n
```

This direction determines where the sky feature projects on screen. A distant-sky implementation can translate its background with the camera to avoid false nearby parallax, while keeping its orientation tied to celestial coordinates. The camera’s rotation must change the visible sky. Planets and asteroids instead use finite 3D positions, distances and occlusion.

An all-sky direction layer is appropriate for ordinary solar-system viewing. Meaningful interstellar travel requires stellar distance/proper-motion data and will change familiar apparent patterns; a fixed Earth-based constellation drawing must not be presented as a universally rigid 3D structure.

The third-person camera used to show “where am I?” is an **inspection camera**, separate from the actual viewing camera. Moving that inspection camera must not change the observer, target or apparent sky.

## 7. Integration architecture and current issues

### Recommended ownership

Keep one authoritative application state for camera position, orientation, reference frame, field of view, simulation time, observer, target and active display mode. The existing world view owns the user journey. Telescope overlays dispatch commands to that state. WWT imagery/catalog support and the Python astronomy service feed the scene through adapters with documented units and reference frames.

The final renderer strategy remains an engineering decision. A single renderer is simplest for shared depth and occlusion; a composited approach requires synchronized cameras, projection, depth and input handling. Two independent canvases or an iframe placed over the globe do not by themselves create one coherent scene. The separate Observatory route should serve as a development harness until its useful components are integrated; it should not become the required user entry point.

### Source-observed gaps

1. **Two state/navigation systems:** the Observatory store and existing world-view state are separate. Reusing controls without reconciling ownership risks conflicting cameras and target selections.
2. **Camera readout mismatch:** `useAstronomy.ts` calculates from the stored selected target coordinates, not necessarily the actual WWT camera after manual panning. Direction/altitude readouts can therefore describe a previous target.
3. **Body-target mismatch:** the scene API accepts a `target`, but the current hook does not send the selected body name. A correct body-observation flow must pass and interpret that target consistently.
4. **Incomplete return state:** the existing mode transition saves height rather than a complete pose.
5. **Constellation completeness differs by renderer:** the prototype’s full name/centroid catalog does not prove the existing Cesium overlay has complete figures and boundaries. The existing overlay uses finite-radius Earth-centered geometry, which needs review before arbitrary camera translation.
6. **Schematic versus physical scale:** the solar-system diagram enlarges bodies for visibility. That is useful if labeled, but must not be confused with a physical telescope view.
7. **Prototype calculation limits:** dates are restricted to 2000–2050; packaged Earth-orientation data and a fixed obliquity rotation are used; the geometric observer sum is an approximation. These are visualization choices, not a precision navigation solution.
8. **Online dependencies:** the constellation catalog and remote imagery/model sources are not a complete local asset pack. A warm browser cache is not proof of offline support.

Implementation references: [state](../../../src/core/state/observatoryStore.ts), [astronomy hook](../../../src/components/observatory/useAstronomy.ts), [WWT canvas](../../../src/components/observatory/WWTCanvas.tsx), [spatial diagram/model](../../../src/components/observatory/SpatialView.tsx), [Python calculations](../../../bridge/astronomy_physics.py), [API](../../../bridge/astronomy_api.py), [existing constellations](../../../src/hooks/cesium/useConstellations.ts).

## 8. Design expectations

Retain Silver Wolf’s world view, panel structure, typography and established theme tokens. Telescope should feel like an expansion of the current controls. Use the existing accent palette for selected targets, focus and active mode; keep most astronomical imagery in its source colors so UI styling does not imply a scientific wavelength or intensity.

- Put compact controls over the view, with opaque-enough surfaces for legible text against both bright Earth and dark sky.
- Preserve a large unobstructed viewing area. Collapse secondary inspectors rather than introducing a permanent second application layout.
- Distinguish **FOV**, **distance**, and **observer altitude** in labels and units. They are different quantities.
- Provide visible selected states, keyboard focus, accessible names and touch-sized controls. Do not encode selection through color alone.
- Avoid surprise camera travel. Label the difference between Observe, Orbit and Travel.
- Respect reduced motion for slews and mode transitions; provide cancel/reset controls for long moves.
- On narrow screens, expose the same functions through compact sheets and maintain a clear return-to-Space control.
- Attribute imagery/models and identify schematic scaling, simulation time and unavailable data close to the relevant controls.

## 9. Research priorities and acceptance criteria

These priorities are based on this user’s repeated requirements and implementation evidence, not a representative user study. Frequency below means recurrence in the available project evidence, not a population estimate.

| Priority | User problem / surface | Severity and frequency signal | Confidence | Recommended move |
|---|---|---|---|---|
| 1 | Separate Observatory breaks continuity with the world view | High; repeatedly corrected in this chat | High | Integrate into the existing scene and mode switcher |
| 2 | Pullback can be mistaken for unlocked look-around | High; current requirement plus source behavior | High | Add explicit free orientation and verify a 180° turn |
| 3 | Camera/target/frame disagreement can mislead readouts and sky placement | High; source-level integration gaps | High for risk; visual extent unmeasured | Establish one camera/time/frame contract |
| 4 | Loading/failure can appear to mean no celestial content | Medium–high; legacy connection failure recorded | High for recorded failure | Distinguish engine, API, catalog and imagery states |
| 5 | Mode return loses context | Medium; height-only save in current source | High | Save/restore the full pose and selected context |
| 6 | Performance claims lack a current runtime baseline | Medium; zero samples in recorded check | High | Measure the integrated scene once running |

### Next implementation milestone

1. Connect telescope capability state to the existing world-view entry point.
2. Save/restore a complete camera pose; separate angular zoom from translation.
3. Implement look-around and verify Earth, sky and constellation alignment in forward, sideways and backward views.
4. Integrate shared time/observer/target data and synchronize actual camera readouts.
5. Add body and deep-sky selection with truthful geometry and loading states.
6. Verify the end-to-end journey on desktop and a narrow viewport before calling the integration complete.

### Acceptance criteria for that milestone

- Telescope opens within the existing world view without navigating to `?view=observatory`.
- Turning 180° changes the visible sky while preserving observer position.
- Earth remains physically placed and occludes appropriately in physical mode.
- Constellation labels, figures and boundaries stay registered to the correct sky directions as the camera turns.
- All 88 constellation entries are available; catalog availability and rendering completeness are checked separately.
- A planet is rendered as a sphere; an available asteroid shape model loads with provenance.
- A deep-sky object can be selected beyond the planet list.
- Camera readouts reflect the actual current view, not only the last selected target.
- Returning to Space restores the saved Earth-view pose.
- API/catalog/imagery failures are recoverable without trapping the user in Telescope.

### Later work and deeper research

After the continuous scene works, investigate runtime cost, tile-cache policy, model coverage and catalog completeness. A fuller offline edition needs a selected, licensed asset manifest, local URL resolution, explicit coverage/zoom limits, and a network-disabled verification run. Complete-media mirroring and physically meaningful interstellar navigation remain separate research/engineering projects; neither is delivered by the current prototype.

## 10. Evidence, verification and coverage limits

### Available chats reviewed

| ID | Chat | Contribution |
|---|---|---|
| C1 | `01a17784-da04-7d13-bf49-a59c7a683951` — design/WWT research and prototype | Design decisions, media research, generated artifacts, prototype work and corrections |
| C2 | `01a1776c-29eb-7963-bdfe-abf010c903d4` — codebase best practices and globe fixes | Integration review, UI/camera changes, source-list and renderer cleanup, recorded checks |
| C3 | `01a177ad-d895-70d2-805d-46c5fcaf6b63` — optimization | Performance plan and incomplete runtime measurement |
| C4 | `01a177b2-a4dd-7a02-8eae-879744cf552e` — Git diff/history | Repository identification, cached-history comparison and failed remote fetch |

The chat list exposed eight tasks: four relevant active today, two older Silver Wolf tasks, and two unrelated tasks in another workspace. The older native-WWT request provides historical design context but is not counted as work performed today. No unavailable remote hosts were reported. This is comprehensive for the available relevant Codex task evidence, not a claim of access to every external chat service.

### Notion coverage

The connected [Silver Wolf Sync page](https://app.notion.com/p/3623ae7010f88142954af509eb4e45ab) describes an Antigravity synchronization log but contained no substantive daily entries in the retrieved content. Its parent likewise did not supply a work log for today. Therefore no additional Antigravity implementation work is asserted here. A page title or synchronization intention is not evidence that changes occurred.

### Checks and their limits

- C2 reported successful typecheck/build and targeted lint with warnings. Those results apply to its recorded snapshot; they do not certify all later shared changes.
- C1 recorded a successful prototype build and API/engine readiness checks. Complete visual correctness, asteroid rendering and the integrated world-view journey were not established.
- C3’s runtime performance run produced zero runtime samples. Its compressed bundle scan was valid for the existing build at that time and predates subsequent prototype additions.
- C4 could not refresh remote Git refs. No current remote synchronization claim is made.
- This document was checked against relevant current source and the available task evidence. No new application test suite was run while preparing it.

**Current conclusion:** useful research, UI fixes and a working-code prototype have been produced. The defining remaining work is to make Telescope a coherent extension of Silver Wolf VI’s existing world scene, with a correctly registered surrounding sky and a camera that can genuinely turn away from Earth.
