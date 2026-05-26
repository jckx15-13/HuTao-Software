# Incident Report INC-0001

## Title
Phase 3 UI Consolidation: Perceived Feature Deletion After Spatial/Telescope Control Surface Migration

## Date
2026-05-26

## Reported By
Internal review after user report of missing features

## Severity
High

## Status
Open

## Owner
TBD

## Executive Summary
A user reported that features were deleted after the Phase 3 commit. Diff analysis confirms that no files were deleted in commit `9cb6548`, but substantial UI code was removed from `GoogleEarthRemix` and `WorldWideTelescopeView` and migrated into a unified left sidebar (`LeftPanel`) with global state orchestration. This created a high-confidence perception of feature loss due to removal of in-context controls. One previously local control appears to be truly removed rather than migrated: the telescope view manual refresh control.

## Incident Scope
1. Branch analyzed: `main`
2. Baseline commit (pre-change): `c5f20ea`
3. Incident commit: `9cb6548` (`feat: Phase 3 - Unified Spatial Explorer`)
4. Author date of incident commit: 2026-05-26 20:44:54 +0800
5. Current head at time of analysis: `9cb6548`

## Technical Evidence

### Commit-level change volume
1. Files changed: 15
2. Insertions: 2577
3. Deletions: 802
4. File deletions: 0

### High-impact file delta summary
1. `src/components/learning/GoogleEarthRemix.tsx`: +24 / -509
2. `src/components/learning/WorldWideTelescopeView.tsx`: +7 / -94
3. `src/components/panels/LeftPanel.tsx`: +625 / -39
4. `src/store/uiStore.ts`: +525 / -83
5. `src/data/constellations.ts`: +88 / -0 (new)
6. `src/hooks/cesium/useConstellations.ts`: +104 / -0 (new)

Interpretation:
1. Large UI removal occurred in page-local components.
2. Large UI/state addition occurred in shell/global components.
3. This pattern is consistent with migration, not blanket deletion.

## What Was Lost vs What Was Moved

### A. Features removed from original in-context location (`GoogleEarthRemix`)
The following local UI surfaces were removed from `GoogleEarthRemix`:
1. Left vertical action toolbar.
2. Panel switching model (`activePanel`) for contextual sub-tools.
3. Local Search & Explore panel.
4. Local Voyager Stories panel.
5. Local Saved Places panel.
6. Local Style & Graphics panel.
7. Local Distance Ruler panel (including local reset button).
8. Local Ingestion Plugins panel (including status strip in that local context).
9. Local shortcuts in that toolbar for Settings and User/Auth action.

### B. Features removed from original in-context location (`WorldWideTelescopeView`)
The following local UI surfaces were removed from `WorldWideTelescopeView`:
1. Local right-side telemetry/control panel.
2. Local target preset selector block.
3. Local target telemetry card (RA/Dec/FOV).
4. Local synopsis block.
5. Local manual refresh button and refresh handler.

### C. Features functionally migrated (not deleted)
The following capabilities were moved into unified sidebar architecture (`LeftPanel`) with store-backed state:
1. Search and result selection (landmarks + plugin entities).
2. Saved Places browsing and selection.
3. Voyager tour launching.
4. Style/graphics controls (presets/toggles/resolution controls).
5. Distance ruler point selection and distance display.
6. Plugin toggling and visibility controls.
7. Telescope target preset management.
8. Telescope target telemetry display.
9. Telescope target synopsis display.

### D. Features likely truly removed (or no longer exposed equivalently)
1. Local telescope manual refresh control from `WorldWideTelescopeView` appears removed without equivalent local affordance in the same context.

## Features Added in Phase 3

### A. Unified Spatial HUD architecture
1. New accordion-style control system in `LeftPanel` for spatial/telescope workflows.
2. Mode-aware panel behavior tied to interaction mode (`orbital`/`telescope`).
3. Cross-feature co-location that reduces duplicated UI logic across components.

### B. Global state unification (`uiStore` integration)
1. Shared `activeTour` and `activeTourStepIndex`.
2. Shared `measureStart` and `measureEnd`.
3. Shared `telescopeTarget`.
4. Better cross-component consistency from centralized state.

### C. Spatial enhancements
1. Cursor interaction improvements (`grab`, `grabbing`, hover pointer behavior).
2. Constellation dataset introduction.
3. Cesium constellation rendering hook introduction.
4. Cesium background integration for celestial overlays.

## Why This Incident Is Significant
1. User trust risk: UI relocation can be perceived as deletion when habitual entry points disappear.
2. Workflow interruption risk: formerly adjacent controls now require panel awareness and navigation.
3. Discoverability risk: if sidebar is collapsed or mode-gated, users may not locate migrated capabilities.
4. Regression risk: local affordances with strong muscle-memory value may disappear even if core logic remains.
5. Support burden risk: issue reports increase when migration is undocumented or un-signposted.

## Clarified Ambiguities
1. "Feature lost" in this incident mostly means "removed from previous location," not necessarily "deleted from codebase."
2. No repository reset/backward checkout occurred in the incident commit; this is a forward commit on top of `c5f20ea`.
3. Functional parity is partial: many controls moved, but not all local affordances are clearly retained in equivalent form.

## Events Leading to the Incident (Chronology)
1. Pre-incident state (`c5f20ea`): page-local Earth and Telescope components each contained their own full control surface.
2. Phase 3 development intent: unify controls under a shared "Spatial HUD" model and centralize state.
3. Incident commit (`9cb6548`, 2026-05-26): large-scale simultaneous refactor of UI surface and state ownership.
4. Immediate post-merge effect: major local control surfaces disappeared from their historical locations.
5. User observation: controls appeared deleted.
6. Analysis result: migration-heavy refactor with a small subset of potentially true removals.

## Root Cause Analysis
Primary cause:
1. Large UX/control-surface migration executed in one commit without in-app migration cues.

Contributing causes:
1. Local controls removed before user-facing discoverability bridges were added.
2. Global sidebar dependence introduced mode/visibility coupling that can hide migrated features.
3. No explicit old-to-new control mapping presented to end users.
4. Absence of a documented parity checklist gate before merge.

## Impact Assessment
1. End-user impact: high confusion and reduced task velocity in spatial/telescope workflows.
2. Product impact: perceived regression despite architectural progress.
3. Engineering impact: increased verification effort to prove feature parity.

## Risk Assessment
1. Short-term risk: repeated duplicate bug reports of "missing features."
2. Medium-term risk: users bypass new workflow, reducing adoption of unified HUD.
3. Long-term risk: accumulated UX debt if local-critical shortcuts are not reinstated.

## Immediate Corrective Actions Recommended
1. Add inline notice in Earth/Telescope views: "Controls moved to Spatial HUD (left panel)."
2. Add direct one-click "Open Spatial HUD" CTA in affected views.
3. Reintroduce local telescope refresh affordance or provide equivalent obvious action.
4. Publish migration notes with explicit mapping table (old location -> new location).
5. Add parity QA checklist covering every pre-Phase-3 control path.

## Verification Plan
1. Create test matrix by feature intent, not component name.
2. Validate each legacy workflow in new UI path.
3. Confirm behavior when sidebar is collapsed.
4. Confirm behavior across interaction modes (`orbital`, `telescope`).
5. Validate plugin/state interactions still fire expected camera/store side effects.

## Detailed Feature Mapping (Old -> New)
1. Earth Search panel -> LeftPanel "Search & Explore" section.
2. Earth Voyager panel -> LeftPanel "Voyager Stories" section.
3. Earth Places panel -> LeftPanel "Saved Places" section.
4. Earth Style panel -> LeftPanel "Style & Graphics" section.
5. Earth Measure panel -> LeftPanel "Distance Ruler" section.
6. Earth Plugins panel -> LeftPanel "Ingestion Plugins" section.
7. WWT presets panel -> LeftPanel "Star Array Presets" section.
8. WWT telemetry card -> LeftPanel "Target Telemetry" section.
9. WWT synopsis card -> LeftPanel "Astronomical Synopsis" section.
10. WWT local refresh button -> No clear equivalent local control found (candidate regression).

## References
1. Commit `9cb6548`: `feat: Phase 3 - Unified Spatial Explorer`
2. Baseline `c5f20ea`: `Fix directory structure from bad merge and update dependencies`
3. Primary files reviewed:
- `src/components/learning/GoogleEarthRemix.tsx`
- `src/components/learning/WorldWideTelescopeView.tsx`
- `src/components/panels/LeftPanel.tsx`
- `src/store/uiStore.ts`
- `src/components/background/CesiumBackground3D.tsx`
- `src/data/constellations.ts`
- `src/hooks/cesium/useConstellations.ts`

## Conclusion
This incident is a migration-visibility and parity-assurance failure, not a repository rollback or mass deletion event. Most core capabilities were relocated into a unified architecture, but the user-facing transition lacked sufficient guidance and at least one local control appears to have lost parity.
