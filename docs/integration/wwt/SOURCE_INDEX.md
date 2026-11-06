# WorldWide Telescope source compilation

Compiled 26 October 2026. This index covers camera position, celestial viewing, media storage and design expectations. Public webcam/camera plugins in WorldWideView are unrelated to the telescope camera and are excluded. Historical docs are retained as historical evidence; they are not all current implementation contracts.

## Report and research files

- [Full report](WWT_DESIGN_AND_MEDIA_REPORT.md)
- [Design Report document](WWT_DESIGN_AND_MEDIA_REPORT.docx)
- [Catalog snapshot and upstream revision](research/catalog-snapshot.json)
- [All 4169 fetched ImageSet definitions](research/imageset-inventory.csv)
- [Original imageset XML metadata archive](research/catalog-metadata.zip) — 45 source files at the pinned revision; imagery is not included.
- [Five measured tile responses](research/tile-samples.json)
- [Reproducible storage scenarios](research/storage-estimates.csv)

The CSV is a full metadata inventory for the fetched core-catalog imagesets directory, not a download of its image tiles or every external WWT catalog. The raw XML was fetched at pinned revision 2c7d96f14bae041501943b9281f71a84a5310f6e. No multi-resolution media pyramid was downloaded.

## Local documents

| Document | Camera or design content |
| --- | --- |
| [DESIGN.md](../../../DESIGN.md) | Shared layout, type, palette roles and interaction expectations |
| [DOCS.md](../../../DOCS.md) | Astronomy module map, precession, sidereal rotation and design history |
| [Historical WWT plan](../../WWT_INTEGRATION_PLAN.md) | Horizon equation and proposed camera bridge |
| [Integration preparation](../../WWT_INTEGRATION_PREPARATION.md) | Existing architecture conflicts, camera issues and offline storage phases |
| [Asset and data architecture](../../ASSET_DATA_ARCHITECTURE.md) | Catalogs, surveys, simplified boundaries, local preview files and missing tile cache |
| [Learning architecture](../../ARCHITECTURE_LEARNING.md) | Learning workspace and spatial renderer design |
| [June project report](../../project-report-2026-06-23.md) | Historical astronomy and constellation behavior claims |
| [Theme engine](../../SilverWolf_Theme_Engine.md) | Palette rationale and theme roadmap |
| [Provisional capability audit](../../manual/Operator-Manual.md) | Telescope, visibility, failure state and mobile concerns |
| [October design audit](../../design-audit-2026-10-26/README.md) | Prior observed screens and usability findings |
| [Codebase review](../../CODEBASE_REVIEW_2026-10-26.md) | Integration evidence levels and naming/architecture drift |

## Implementation evidence

| Source | What to read |
| --- | --- |
| [useCameraSync.ts](../../../src/hooks/useCameraSync.ts) | Earth angular-size equation and current outbound callback |
| [useWWTListener.ts](../../../src/hooks/useWWTListener.ts) | Inbound state schema and synchronization lock |
| [earthObserverProjection.ts](../../../src/lib/earthObserverProjection.ts) | GMST, sky direction subpoint and observer projection |
| [coordinateTransforms.ts](../../../src/lib/coordinateTransforms.ts) | RA conversions and precession |
| [astronomy.ts](../../../src/lib/astronomy.ts) | Approximate orbital elements and light-time correction |
| [telescopePresets.ts](../../../src/data/telescopePresets.ts) | Target catalog and dynamic planetary coordinates |
| [WorldWideTelescopeView.tsx](../../../src/components/learning/WorldWideTelescopeView.tsx) | Research-app URL, messages, watchdog, controls and fallbacks |
| [useConstellations.ts](../../../src/hooks/cesium/useConstellations.ts) | Celestial sphere positions, labels and constellation overlays |
| [Native celestial layer](../../../src/core/celestial/useNativeCelestialSky.ts) | Synthetic stars, grid and media pins |
| [WTML parser](../../../src/core/celestial/wtmlManifest.ts) | Current limited metadata import |
| [Survey registry](../../../src/data/astronomy/surveys.json) | Available layer metadata and preview paths |
| [Media catalog](../../../src/data/astronomy/mediaCatalog.json) | Local object records and optional thumbnails |
| [Asset manifest](../../../src/core/celestial/assetManifest.ts) | Provenance fields and availability reporting |
| [Theme engine](../../../src/lib/themeEngine.ts) | Actual default and alternate palettes |
| [Runtime styles](../../../src/index.css) | Fonts, UI variables, layout and stacking |

## Official external documentation

- [WWT TOAST projection and tile pyramids](https://docs.worldwidetelescope.org/data-guide/1/spherical-projections/toast-projection/)
- [WWT data formats](https://docs.worldwidetelescope.org/data-guide/1/data-file-formats/)
- [WWT CenterOnCoordinatesMessage](https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/research-app-messages/interfaces/classicPywwt.CenterOnCoordinatesMessage.html)
- [WWT ViewStateMessage](https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/research-app-messages/interfaces/ViewStateMessage.html)
- [WWTControl camera API](https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/engine/classes/wwtcontrol.html)
- [WWT self-hosting and embedding](https://docs.worldwidetelescope.org/research-app/latest/embedding/)
- [WWT core catalog at the fetched revision](https://github.com/WorldWideTelescope/wwt-core-catalogs/tree/2c7d96f14bae041501943b9281f71a84a5310f6e)
- [WWT cache documentation and corpus scale](https://docs.worldwidetelescope.org/planetarium-guide/1/caches/)
- [IAU constellation definitions and boundaries](https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx)
- [ESA Earth coordinate systems](https://gssc.esa.int/navipedia/index.php/Cartesian_and_ellipsoidal_coordinates)
- [Astropy local sky coordinates](https://docs.astropy.org/en/stable/api/astropy.coordinates.AltAz.html)
- [Astropy Solar System ephemerides](https://docs.astropy.org/en/stable/coordinates/solarsystem.html)
- [JPL SPICE observer and target states](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/spkezr_c.html)
- [Browser storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

## Design QA applicability

The report is a research and integration specification. No new prototype or approved visual mock was produced. Product Design QA applies when an intended visual and matching rendered implementation can be compared. The formatted report is separately rendered and checked against its retained document template; this does not certify the app UI.
