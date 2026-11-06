# WorldWide Telescope integration: preparation and local-first plan

For the expanded camera equations, catalog inventory, media freshness, storage scenarios and shared visual design expectations, see the [WWT design and media report](integration/wwt/WWT_DESIGN_AND_MEDIA_REPORT.md) and its [source compilation](integration/wwt/SOURCE_INDEX.md).

**Status:** Proposed implementation plan; no integration code changed in this review.
**Reviewed:** 2026-10-26
**Scope:** The AAS WorldWide Telescope (WWT) astronomy experience inside Silver Wolf VI, including the existing remote research-app iframe, the native Cesium celestial layer, WTML input, and durable local storage of catalogs and visual assets. This is distinct from WorldWideView (WWV), the geospatial product.

## Decision summary

Use a **hybrid, explicitly separated architecture**:

1. Keep the official WWT Research App as an optional online exploration surface for broad WWT functionality.
2. Make the native Cesium celestial layer the dependable offline and local-asset surface. Treat WTML as an importable catalog/manifest format; do not imply that parsing a WTML file reproduces WWT's imagery renderer.
3. Store small structured records and user collections in IndexedDB; store visual blobs in IndexedDB or Cache Storage; use a service worker for the app shell and same-origin asset responses. Add an explicit offline-pack import/export path for durable, portable collections.
4. For large local tile pyramids, evaluate OPFS or a desktop-managed application-data directory only after defining an actual tile renderer and quota policy. Do not put imagery in `localStorage`, and do not promise that browser cache is permanent.

This keeps the useful WWT connection while making local data behavior testable and honest. A remotely hosted iframe cannot be made fully offline by the parent app's cache layer. If the entire WWT app itself must run offline, self-host a built Research App and separately mirror every required catalog, WTML document, thumbnail, and tile asset that its collections reference, subject to each source's license and redistribution terms.

## Current implementation map

| Area | Current source | What it does today | Evidence / limit |
|---|---|---|---|
| WWT Research App | `src/components/learning/WorldWideTelescopeView.tsx` | Builds an iframe URL under `https://web.wwtassets.org/research/latest/`, posts control messages, owns a load watchdog, and renders fallback/error UI. | The frame and controls exist; this review did not prove a successful WWT session or wait through the full 45-second watchdog. |
| Inbound message hook | `src/hooks/useWWTListener.ts` | Listens for a custom `wwt_view_state` message and throttles updates. | It does not check `event.origin`, `event.source`, or numeric bounds. The component calls `useWWTListener()` without a callback at its current call site. Treat this pathway as unverified and unsafe to use for control until repaired. |
| Camera bridge | `src/hooks/useCameraSync.ts` | Converts Cesium camera position/altitude to an outbound view command with a global mutex and timer-based throttle. | Current RA/Dec conversion uses longitude/latitude directly; it does not account for sidereal time or a defined celestial camera model. `calculateHorizonFOV()` computes apparent Earth angular diameter from altitude, not the Cesium camera frustum FOV. Do not rely on this for scientifically meaningful sky synchronization. |
| Native celestial layer | `src/core/celestial/useNativeCelestialSky.ts` | Draws seeded stars, grids, and local media pins in the shared Cesium viewer. Parses one WTML manifest into an object position and attribution. | It does not load WWT survey tile pyramids. Missing manifest fetch currently clears the pin; there is no saved local copy in this hook. |
| Survey metadata | `src/data/astronomy/surveys.json`, `src/core/celestial/SurveyRegistry.ts` | Describes survey names, bands, palettes, attribution, license notes, optional preview paths, and offline priority. | Metadata is local; referenced survey preview files are not currently present. Some license summaries need per-asset verification before mirroring. |
| Media catalog | `src/data/astronomy/mediaCatalog.json`, `src/core/celestial/mediaCatalog.ts` | Keeps object names/coordinates/provenance local; allows an optional thumbnail. | The catalog is local; thumbnail entries are currently null or not mirrored. |
| Asset manifest | `src/core/celestial/assetManifest.ts` | Derives source, path, checksum, retrieval date, license, attribution, and priority records. | Checksums and retrieval dates are null until assets are mirrored; the current availability function depends on a caller-supplied `hasLocalAsset` check. No checksum enforcement or tile cache manager was found. |
| WWV repository data | `src/lib/wwt/repositoryData.ts` | Fetches some WorldWideView JSON assets by trying local `public/wwv-assets` candidates and then GitHub raw URLs. | This is a separate product-data mirror. It does not implement WWT imagery storage or an offline tile cache. |
| Asset architecture | `docs/ASSET_DATA_ARCHITECTURE.md` | States that metadata is committed, image directories are optional, runtime cache belongs under `data/assets/`, and the native layer uses no iframe. | Good offline-first intent, but the runtime cache and deep tile pyramids are explicitly not implemented. It conflicts with treating the iframe in `WorldWideTelescopeView.tsx` as the whole integration. |

## Issues in the current plan and design

### P1 — It combines unrelated products and ambiguous names

`docs/WWT_INTEGRATION_PLAN.md` is titled as a dual-source master plan and mixes WorldWideView/WWV, its data engine and seeders, and World Wide Telescope/WWT. It contains a planned WWT iframe and camera bridge, while `docs/ASSET_DATA_ARCHITECTURE.md` explicitly describes a native Cesium renderer with no iframe. This makes it unclear which architecture is approved. Keep the WWV ecosystem inventory separate and use this document as the WWT-specific implementation plan. Expand acronyms on first use in UI and docs.

### P1 — The remote iframe is treated as if it can provide local/offline visuals

The current iframe origin is `web.wwtassets.org`, outside the Silver Wolf origin. The parent app cannot inspect or rewrite the iframe's internal network requests or reliably manage its storage. Browser-managed cache is best-effort, not a selected, verified offline library. Official WWT documentation supports embedding the hosted app and also describes building/self-hosting a static Research App, but self-hosting the app shell does not itself mirror the external astronomy imagery it references. ([WWT embedding guide](https://docs.worldwidetelescope.org/research-app/latest/embedding/), [MDN storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria))

### P1 — The proposed camera mapping does not define a valid celestial synchronization contract

`useCameraSync.ts` maps Cesium longitude to right ascension and latitude to declination without epoch/UTC/sidereal conversion, and derives `fov` from apparent Earth size instead of the actual view frustum. This can send plausible-looking but scientifically incorrect coordinates/zoom. Define the supported use case first: geographic camera ↔ Earth observer frame, or celestial camera ↔ WWT sky coordinates. Use a tested astronomy transform and the renderer's actual FOV. Add known-date/known-location cases and document units (degrees versus hours) before enabling two-way sync.

### P1 — Incoming `postMessage` data is not authenticated or schema-validated

`useWWTListener.ts` accepts any window message with `{ type: 'wwt_view_state' }`. Validate exact WWT origin and exact iframe `contentWindow`, parse a typed message using the official WWT message definitions where possible, and reject non-finite/out-of-range RA, Dec, FOV, and roll. Outbound `postMessage` calls must keep an exact target origin; the official WWT guide explicitly warns against wildcard target origins and says the message surface requires careful security handling. ([WWT controlling embeds](https://docs.worldwidetelescope.org/research-app/latest/controlling/), [WWT message/API reference](https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/))

### P1 — The offline asset model is specified but not implemented

`docs/ASSET_DATA_ARCHITECTURE.md` defines a mutable runtime cache at `data/assets/astronomy/`, yet browser code cannot write into a project repository directory and no cache manager consumes that path. Browser persistence must be origin-managed (IndexedDB, Cache Storage, or OPFS) or explicitly user-selected via File System Access. Browser-managed storage can be evicted or cleared, and quotas differ by browser. ([MDN storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [MDN OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system))

### P2 — “WTML support” overstates what the parser currently imports

`wtmlManifest.ts` uses regular expressions to read a small subset of XML (`Place`, `ImageSet`, name, RA/Dec, thumbnail, credits). It does not import the collection hierarchy, recursively resolve folders, or render image-set tile pyramids. Its URL validator allows arbitrary HTTPS URLs; fetching those manifests can still encounter CORS, large responses, redirects, or untrusted markup/references. Rename the capability to “WTML place/metadata import” until a fuller, validated subset is supported. Set payload/timeout limits, validate all resulting URLs, and only render local/approved assets.

### P2 — Asset provenance and availability are not yet operational guarantees

The manifest has the right fields, but a null checksum means an asset has not been verified, and a source page is not necessarily a direct downloadable image. A directory existing or a URL returning HTTP 200 is not proof that the correct version, dimensions, license, attribution, or tile scheme is present. Some current license rows are broad summaries; check the exact archive record and asset terms before packaging or redistributing visuals.

### P2 — The WWT component has too many responsibilities for the next integration stage

`WorldWideTelescopeView.tsx` coordinates iframe lifecycle, message transport, camera sync, collections, timeline, controls, fallbacks, and a draggable feed window. The repository guidance already identifies it as a large file. Split transport/runtime state, view controls, offline data packs, and Cesium rendering into focused modules before adding cache lifecycle and retry behavior. This makes cancellation, storage failures, and renderer state easier to test.

## Recommended local storage design

### What belongs where

| Information | Recommended location | Reason |
|---|---|---|
| User preferences, selected survey ID, small active-pack ID | `localStorage` or existing settings store | Small, synchronous settings only; no binary payloads. |
| Structured object catalogs, bookmarks, local WTML parse results, provenance, pack manifests, sync status | IndexedDB | Asynchronous indexed queries and transactional updates; works for offline application data. |
| Survey preview images, thumbnails, and downloaded same-origin tile responses | Cache Storage, keyed by immutable content URL/version | Natural request/response cache for rendering through local URLs and a service worker. |
| Large mutable tile/file blobs where streaming and random access matter | OPFS, behind a storage adapter; optional desktop app-data directory for packaged deployments | File-like local storage with quota/eviction handling; not visible as ordinary user files and not automatically portable. |
| User-owned portable offline collection | Explicit import/export archive, e.g. ZIP with `manifest.json` plus assets | Makes backups and device transfer user-controlled and independent of browser cache eviction. |

IndexedDB supports structured data and blobs; Cache Storage is suited to request/response pairs; OPFS is private to the origin, subject to quota, and cleared with site data. Request persistent storage only after the user opts to keep an offline pack, and show whether it was granted. Never promise permanence solely because a browser write succeeded. ([IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [Cache API/service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers.), [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system))

### Offline pack shape

An offline pack should be a versioned, self-contained package whose manifest looks conceptually like:

```json
{
  "schemaVersion": 1,
  "packId": "dss-intro-v1",
  "title": "DSS introductory sky",
  "createdAt": "2026-10-26T00:00:00Z",
  "assets": [
    {
      "id": "survey:dss:preview",
      "kind": "image",
      "path": "assets/dss-allsky.jpg",
      "sha256": "<computed at pack time>",
      "bytes": 123456,
      "mediaType": "image/jpeg",
      "sourceUrl": "https://archive.stsci.edu/dss/…",
      "license": "<verified for this file>",
      "attribution": "<required credit>"
    }
  ]
}
```

The values above are schema examples, not existing verified assets. A pack import should validate schema/version, maximum unpacked size, file count, MIME/type, checksum, normalized relative paths, duplicate IDs, source/license/attribution, coordinate ranges, and the selected tile scheme before committing. Reject path traversal, executable content, unexpected redirects, and XML external entities. Stage the import, verify all assets, then atomically mark the pack available. If any required file is missing or fails checksum, keep the previous pack intact and report the exact failure.

### App storage lifecycle

1. **Inventory:** Build a user-readable manifest from actual files; show required/preferred/optional, total size, source, license, and whether each asset is bundled, downloaded, or missing.
2. **Preview:** Show estimated download size and license/attribution before saving. Only offer assets approved for local caching/redistribution.
3. **Download:** Fetch with abort, timeout, and progress. Verify response type, size limit, digest, and metadata. Cache by content hash/version, not just mutable URL.
4. **Commit:** Write bytes and metadata transactionally, then mark the pack available. Use a temp/staging key so interrupted downloads never appear complete.
5. **Serve:** Native Cesium rendering resolves the chosen asset through a local asset provider; offline mode must not silently request a remote fallback. Preserve a clear `missing/offline` state.
6. **Maintain:** Track last use, pin status, bytes, and verification. Offer remove-pack and clear-cache controls; evict only unpinned optional assets using LRU when quota is tight.
7. **Export/import:** Create a portable archive with all referenced files and a license/readme. On import, validate before committing and display attribution.

### Important limitation: offline tiles require a renderer

The current native layer uses a synthetic seeded star field, grid, and catalog pins. It records survey previews in metadata but does not consume multi-resolution HiPS/TOAST tiles. Caching tiles without a tile traversal/rendering path does not create a working offline survey. Implement a bounded preview tier first. For deep zoom, choose a specific standard and renderer (for example, a documented HiPS tile hierarchy), then add a small offline region/zoom pack and cap it by byte count and angular coverage. Do not mirror an unlimited sky pyramid.

## Integration sequence

### Phase 0 — Set the contract

- Keep this WWT plan separate from WWV/data-engine integration.
- Decide whether WWT means the embedded Research App, a native WWT WebGL engine, or Silver Wolf’s native Cesium celestial layer for each user workflow.
- Keep live WWT imagery online-only until locally mirrored assets and rights are verified.
- Define the camera contract, coordinate frame, epoch, time source, units, and one-way/two-way behavior.

**Exit criteria:** Architecture decision record accepted; no feature copy says “offline WWT” for a remote iframe; message contract and test vectors are documented.

### Phase 1 — Stabilize the online iframe

- Readiness state must come from actual iframe readiness and, ideally, a WWT handshake—not just `iframe.onload` (which can fire for an error document).
- Validate `event.origin`, `event.source`, payload schema/ranges, exact `targetOrigin`, and teardown.
- Model `connecting`, `ready`, `slow`, `unavailable`, and `static fallback` distinctly, with a timeout, retry, and “open WWT separately” action.
- Use the official typed message package/schema or keep a small local adapter against the versioned documented protocol; avoid inventing custom message names without compatibility tests.
- Split the large component into runtime/transport, UI controls, and fallback modules.

**Exit criteria:** Online mode works under normal and blocked-network cases; unrelated windows cannot spoof state; navigation/camera updates do not create feedback loops; the 45-second timeout and retry behavior have visible evidence.

### Phase 2 — Make local catalog data reliable

- Keep small catalogs and provenance bundled in `src/data/astronomy/` and version them.
- Add persistent IndexedDB records for imported collections, bookmarks, and saved observations.
- Replace regex-only WTML parsing with a bounded XML parser configured to reject DTD/external entity resolution; support only a documented safe subset.
- Cache the parsed metadata and show when it is stale or missing. A failed refresh must not erase the last valid local copy.

**Exit criteria:** Import works offline after first save; bad/hostile/malformed files are rejected; valid RA/Dec, epoch, and attribution survive reload.

### Phase 3 — Add curated visual packs

- Verify an initial small set of survey preview images and licenses; populate checksums/retrieval date/source revision and actual byte size.
- Add IndexedDB/Cache Storage provider and a local asset URL adapter for native Cesium.
- Add offline-pack management (install, progress, pinned/optional status, remove, export/import) and quota/persistence status.
- Keep remote fetching opt-in and explicit; do not silently change the selected band or survey if its asset is missing.

**Exit criteria:** A clean profile can install a small pack online, reload with network disabled, render the selected imagery locally, and report exact asset provenance. Removing the pack returns to a labeled no-imagery layer.

### Phase 4 — Deep sky tiles, only if needed

- Select one tile standard and supported tile sources. Validate coordinate ordering, projection, pyramid metadata, and renderer against authoritative fixtures.
- Download only selected regions/bands/zoom levels, with hard size and tile-count budgets.
- Use Cache Storage for stable URL response caching or OPFS for larger managed tile files; maintain a versioned index in IndexedDB.
- Provide cancellation, integrity checks, retry, clear/export, and quota behavior.

**Exit criteria:** Offline pack covers the specified field of view and zoom range, gives correct imagery, fits its declared budget, and degrades without misleading substitution.

## Best practices and specific code improvements

1. **Use official protocol types and strict message validation.** WWT documents JSON control messages and recommends the official message definitions; enforce source/origin checks and exact target origins. ([Embedding control guide](https://docs.worldwidetelescope.org/research-app/latest/controlling/))
2. **Remove the misleading camera math before claiming sync.** Convert using tested celestial coordinate functions and actual camera FOV. Include UTC date/time and coordinate epoch in the contract. The existing `src/lib/coordinateTransforms.ts` and astronomy utilities are better foundations than raw longitude/latitude mapping, but need validation against known values.
3. **Use one state owner for integration status and saved collections.** Avoid duplicating iframe state across local component state, window globals, and stores. Keep storage metadata separate from render state; derive availability from actual storage queries.
4. **Make offline and failure states first-class.** A cached-but-stale asset is different from installed, missing, corrupt, and network-only. Expose the distinction and do not clear last-good local data on refresh failure.
5. **Keep local visuals deterministic.** Pin exact asset versions/hashes and include attribution in both UI details and export packs. Treat third-party terms as per-asset data, not blanket “NASA is free” assumptions.
6. **Avoid large state churn.** Store binary assets outside UI state; keep only asset IDs/status/progress in React/Zustand. Renderers should subscribe to selected IDs rather than whole catalogs/blobs.
7. **Use bounded downloads and cancellation.** Respect max bytes/tiles, abort stale requests on mode/pack changes, handle `QuotaExceededError`, and clean object URLs and partial writes.
8. **Test the user contract, not just helper functions.** Include offline reload, cache eviction, corrupted pack, interrupted download, unavailable WWT, hostile postMessage, WWT-origin mismatch, coordinate round trips, and correct selected-band rendering. This is a proposed verification plan; no tests were run as part of this document review.

## Recommended first deliverable

Implement a modest, reliable offline library before deep tile caching:

- local searchable sky-object catalog and saved WTML metadata;
- one or two legally verified all-sky preview images plus selected thumbnails;
- IndexedDB metadata and binary asset store with checksum verification;
- an offline status panel showing installed/missing/size/source;
- import/export for a versioned offline pack;
- online WWT iframe retained as a separate optional mode with honest connection status.

This gives users useful local records and visuals without promising that the entire remote WWT universe has been downloaded. Deep zoom can follow after a tile format, renderer, license path, and storage budget are confirmed.

## External references

- [WWT Research App embedding](https://docs.worldwidetelescope.org/research-app/latest/embedding/)
- [WWT Research App control messaging and security](https://docs.worldwidetelescope.org/research-app/latest/controlling/)
- [WWT data file formats](https://docs.worldwidetelescope.org/data-guide/1/data-file-formats/)
- [WWT engine and message API references](https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/)
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN service workers and offline caching](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers.)
- [MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [MDN Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
