# World-view telescope prototype — implementation status

Updated 26 October 2026, after the daily report snapshot.

## Current branch

`prototype/wwt-online-observatory`. Changes remain in the shared local working tree.

## Added to the existing world view

- Telescope now mounts `WorldTelescopeOverlay` over the existing Cesium scene, rather than the legacy iframe controls.
- Camera ownership is in `useTelescopeCamera`. It saves the full position, direction, up vector, transform, frustum and tracked entity; exiting restores that snapshot.
- Entry retains the existing pullback, but removes the competing preset-driven Earth-facing flight.
- Telescope enables look-around input and stops the noninteractive idle rotation. Scrolling changes perspective field of view instead of camera distance.
- Explicit Look behind and Face Earth controls change direction at the current camera position.
- The WWT catalog supplies 88 selectable constellations, including both Serpens regions.
- A new Python `/api/astronomy/sky?utc=...` endpoint transforms all 89 region-center directions from ICRS into ITRS using Astropy. The frontend uses those directions for target selection and constellation name labels.
- Name labels translate with the camera while retaining their celestial orientation. They represent directions at infinity, not physical nearby stars or complete boundary/figure geometry.
- The overlay includes search, name visibility, UTC selection, field-of-view display, loading/error state and retry.

## Run the online prototype

From the repository root, start both processes:

```bash
npm run dev
.venv-astronomy/bin/python -m uvicorn bridge.astronomy_api:app --host 127.0.0.1 --port 8011
```

If the astronomy environment does not exist, create a Python virtual environment and install `bridge/astronomy_requirements.txt` first. The Vite astronomy proxy targets port 8011. Open the normal app at `http://127.0.0.1:3005/`, then select Telescope. The separate `?view=observatory` route remains an experimental harness, not the final product entry point.

## Evidence collected

- TypeScript typecheck passed after correcting optional field-of-view handling.
- The new Python sky endpoint returned HTTP 200 and 89 region vectors; maximum unit-length error was approximately `1.11e-16`.
- Browser DOM showed Telescope selected, the new controls, “Constellations (88)”, and “Sky directions ready”.
- A browser screenshot showed the overlay on the existing Earth globe. It exposed a mode-switcher overlap; the overlay offset was subsequently adjusted.
- Button interaction and screenshot attempts subsequently timed out. After a reload, Browser security policy explicitly blocked further access to the local preview. No alternative browser mechanism was used.

## Still incomplete / unverified

- Browser proof of backward viewing, pointer dragging, FOV zoom, selection, full-pose restoration and responsive layout is outstanding.
- The revised layout offset has not been visually verified.
- Full constellation figures/boundaries and real survey imagery are not yet integrated through this new world overlay. Existing legacy celestial layers still need reconciliation; procedural stars must not be treated as a real star catalog.
- Spherical solar-system bodies, asteroid shape models and the observer-context diagram still reside in the separate prototype and need integration with this scene.
- The shared physical observer/time/camera contract is not yet complete. Region directions use the selected UTC, while older world-view celestial layers may still use wall-clock time.

The project goal remains active. These changes are implementation progress, not a completed or fully verified telescope integration.
