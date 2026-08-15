# Asset & Data Architecture — Native Celestial Layer

Where SilverWolf's celestial data comes from, where it lives, how it is cached, and
exactly what happens offline.

The governing rule: **the app must be fully usable with no network and no mirrored
imagery.** Everything required to orient an operator — positions, boundaries, names,
attribution — is local and committed. Imagery is an optional upgrade, never a
prerequisite, and a missing asset is always reported rather than silently substituted.

## Directory strategy

| Path | Committed? | Contents | Mutable at runtime |
|---|---|---|---|
| `src/data/astronomy/*.json` | Yes | Coordinates, boundaries, registries, provenance | No |
| `public/astronomy/surveys/` | Dir only | Mirrored all-sky survey previews | No (build-time mirror) |
| `public/astronomy/media/thumbnails/` | Dir only | Mirrored media thumbnails | No (build-time mirror) |
| `data/assets/astronomy/` | Dir only | Runtime tile/imagery cache | Yes — safe to delete |
| `public/wwv-assets/orbital/` | Yes | Satellite category SVGs (optional billboards) | No |

Imagery directories are committed empty, with a `README.md` explaining provenance. No
unbounded tile cache is ever committed: survey pyramids are large and several carry
archive-specific licence terms. The mutable cache lives under `data/assets/` —
deliberately outside `public/` — so a runtime cache can never be mistaken for a seed
asset.

## Data sources

| Dataset | File | Authority | Licence | Offline |
|---|---|---|---|---|
| Constellation stars & figures | `src/data/constellations.ts` | Standard J2000 catalogue positions | Factual data | Always |
| IAU boundaries | `src/data/astronomy/constellationBoundaries.json` | IAU / Delporte 1930; VizieR VI/49 | Public domain | Always |
| Media pins | `src/data/astronomy/mediaCatalog.json` | NASA/ESA/CSA object catalogues | Coordinates factual; imagery per-entry | Always (positions + attribution) |
| Survey registry | `src/data/astronomy/surveys.json` | DSS/STScI, ROSAT/HEASARC, Planck/ESA, VLSS/NRAO | Per survey, recorded per record | Registry always; imagery only if mirrored |
| WTML manifests | Fetched on demand | WorldWide Telescope data guide | Per manifest | Last parsed result only |

### Epochs

Boundary data is authored by the IAU on the **B1875.0** equinox. The shipped JSON stores
**J2000** values (`sourceEpoch` / `storedEpoch` in its `metadata`), and the renderer
precesses J2000 → observation date via `precessEquatorialJ2000ToDate` before applying
GMST to reach Earth-fixed coordinates. Both epochs are recorded in the file so the
conversion is auditable rather than implicit.

### Known simplification

`constellationBoundaries.json` currently sets `simplified: true`. It stores each
constellation's published J2000 RA/Dec **extent** as a closed rectangular region rather
than the full stepped IAU polygon. This is a faithful but coarse subset: real IAU
boundaries run along arcs of constant RA and constant Dec, which is exactly what an
extent traces, but a true boundary steps between several such arcs. Coverage is
`seed` — the three constellations the scene renders.

The flag is asserted by the test suite, so this cannot silently drift into being
presented as authoritative data.

## Loading and rendering

```
surveys.json ──► SurveyRegistry.ts ─────────────┐
mediaCatalog.json ──► mediaCatalog.ts ──────────┼──► useNativeCelestialSky ──► Cesium scene
constellationBoundaries.json ──► constellationBoundaries.ts ──► useConstellations ──┘
                             └──► assetManifest.ts ──► availability reporting
```

All four data modules are **Cesium-free** so they unit test without a WebGL context.
Only the two hooks touch the viewer, and both mount into the single shared Cesium
scene — there is no second viewer and no iframe.

WTML manifests are treated strictly as *data*: `wtmlManifest.ts` parses a manifest into
coordinates and attribution, which are rendered as a native Cesium media pin. A manifest
is never handed to an embedded viewer.

## Offline behaviour

| Situation | Behaviour |
|---|---|
| No network | Stars, grid, constellation figures, names, boundaries, selection and all media pins render normally |
| Survey imagery not mirrored | `resolveSurveyImagery` returns `unavailable` with a reason; palette/grid/pins still render. **Never substitutes another survey** |
| Media thumbnail not mirrored | `resolveMediaThumbnail` returns `procedural`; the pin draws SilverWolf's generated SVG marker. No remote request is made |
| WTML fetch fails | The media pin for that manifest is dropped; everything else is unaffected |
| Manifest missing coordinates | `parseWtmlCollection` returns `null` rather than placing a pin at 0,0 |

`summarizeAssetAvailability()` reports `total` / `mirrored` / `missing` plus any
`missingRequired` records, which is what the telescope data-configuration surface shows.

## Asset record schema

Every asset is described by `AssetRecord` in `src/core/celestial/assetManifest.ts`:

```ts
type AssetRecord = {
  id: string;
  kind: 'tile' | 'catalog' | 'icon' | 'model' | 'media';
  sourceUrl: string;
  localPath: string;
  sha256: string | null;      // null = NOT VERIFIED, never "verified empty"
  retrievedAt: string | null; // ISO-8601, null until actually mirrored
  license: string;
  attribution: string;
  offlinePriority: 'required' | 'preferred' | 'optional';
};
```

The manifest is **derived** from the individual data files rather than hand-maintained,
so a new survey or media entry cannot ship without provenance. Tests assert that every
record carries an `https` source, a licence, an attribution, a valid priority, and that
a null checksum is always paired with a null retrieval time.

## Populating imagery

Imagery is optional. To mirror it:

1. Download the all-sky preview from the survey's `allSkyPreview.sourceUrl`, honouring
   that archive's terms.
2. Save it to the exact `allSkyPreview.localPath` under `public/`.
3. Record its `sha256` and `retrievedAt` in `surveys.json`.

Do the equivalent for media thumbnails, setting each entry's `thumbnail` to its mirrored
path. Leave `thumbnail: null` for anything not mirrored — a null renders the procedural
pin, whereas a wrong path renders a broken image.

## Not yet implemented

Stated plainly so this document is not read as describing more than exists:

- **Deep tile pyramids.** Only the all-sky preview tier is modelled. HiPS/TOAST
  multi-resolution tile traversal, and the `data/assets/astronomy/` runtime cache that
  would back it, are defined but not yet consumed by the renderer.
- **Full IAU boundary polygons.** See the simplification note above.
- **Checksum enforcement.** `sha256` is carried through the manifest but no mirrored
  asset is currently hash-verified at load time.
