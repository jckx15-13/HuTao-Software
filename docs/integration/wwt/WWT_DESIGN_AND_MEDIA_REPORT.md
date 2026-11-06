# WorldWide Telescope design and integration report

Prepared for Silver Wolf VI • 26 October 2026

## Executive summary

Silver Wolf VI can provide a completely redesigned telescope interface with selected astronomy media stored on the local drive. A dependable implementation needs three explicit camera modes: viewing Earth from space, observing the sky from an Earth location, and travelling around the Solar System. The existing horizon equation is useful for framing Earth, but is not a complete camera model. WWT's catalogs describe thousands of datasets whose actual image content is fetched as tiles; downloading catalog XML does not download those images. Offline storage should therefore be managed as versioned packs with a declared survey, area, resolution, acquisition date, license and byte budget. The interface should use Silver Wolf's purple and cyan controls while preserving the scientific imagery's own colors. [S1–S8; local source inventory in the appendix]

In everyday terms, the catalog is the library index, the tiles are the books, and the camera model tells the app where the reader is standing and which way they are looking. A local copy of the library index is small. A small selection of illustrated books can fit on an ordinary drive. Every accessible survey at every resolution is a much larger, distributed collection: WWT describes access to petabytes of imagery, and publishes no audited single download size for that whole collection. [S7]

### At a glance

| Question | Finding | What it means |
| --- | --- | --- |
| Can it work without internet | Yes, for the installed app and selected local assets | Bundle the renderer and its dependencies, and install complete offline packs |
| How many media entries | 4,169 ImageSet entries in the fetched core catalog snapshot | These are dataset definitions, not the number of image files |
| Are media updated | Catalog changes and new imagery are published; historical images remain historical | Show capture date, publication/version and local download date separately |
| How large is one full body map | Roughly 28–210 GB for an illustrative complete pyramid through level 10 | Different resolutions, bands and sparse coverage change the answer substantially |
| Can the appearance be overhauled | Yes, by owning the UI or maintaining a custom WWT build | A remote iframe's internal styling cannot be changed by parent-page CSS |

## Key findings

### Documents and code that establish the current behavior

The relevant local documents are DESIGN.md, DOCS.md, docs/WWT_INTEGRATION_PLAN.md, docs/WWT_INTEGRATION_PREPARATION.md, docs/ASSET_DATA_ARCHITECTURE.md, docs/ARCHITECTURE_LEARNING.md, docs/project-report-2026-06-23.md, docs/SilverWolf_Theme_Engine.md, docs/manual/Operator-Manual.md and the October design-audit report. They cover visual intent, coordinate transforms, the historical iframe proposal, the native celestial layer, and known gaps. The appendix and SOURCE_INDEX.md identify their roles. These documents disagree in places, so source code and official API definitions must settle implementation details rather than treating every written proposal as shipped behavior.

The historical plan specifies an iframe and altitude-based FOV conversion. The asset architecture describes a native Cesium layer with no second viewer. Both pathways currently exist in source. The native layer draws grid, generated stars and media pins, but does not consume a deep survey tile pyramid. Empty public/astronomy imagery directories and null checksums are evidence of missing local media, not a completed offline library.

### How the camera should behave in plain language

Earth view is an external camera looking at a globe. It needs a position above Earth, a target point, an up direction and a lens width. Moving this camera away makes Earth smaller. Sky observer view is a telescope at a chosen place and time on Earth, looking outward; the horizon, rising and setting objects, and sky rotation depend on that location and time. Solar System view is a camera travelling in a common three-dimensional coordinate system where Earth, the Sun and other bodies each have time-dependent positions.

Changing the observation location is different from panning the telescope. Zooming a nebula photograph is different from flying toward the nebula in three dimensions. A flat image cannot reveal the hidden side of a celestial body or create depth that was never recorded. The UI must communicate whether it shows a photograph, a surface texture on a globe, a calculated orbit, or an illustrative model.

### Camera position relative to Earth

For an explanatory spherical Earth model, let R be Earth's radius, h the camera height, phi geocentric latitude and lambda east longitude. Use one consistent distance unit and radians in trigonometric functions. The Earth-fixed camera position is:

`c_E = (R+h) [cos(phi)cos(lambda), cos(phi)sin(lambda), sin(phi)]`

For the actual WGS84 ellipsoid, phi is geodetic latitude and a is the equatorial semi-major axis. Let e be the ellipsoid eccentricity. The more accurate conversion is:

`N = a / sqrt(1 - e^2 sin(phi)^2)`

`x = (N+h) cos(phi) cos(lambda)`

`y = (N+h) cos(phi) sin(lambda)`

`z = (N(1-e^2)+h) sin(phi)`

These coordinates specify where the camera is, not its pointing direction. Use the existing Cesium ellipsoid conversion rather than duplicating this math in multiple controls. ESA's coordinate references document the ellipsoidal conversion. [S9]

Given camera position c and target p, a simple viewing basis is f = normalize(p-c), right = normalize(f cross upReference), and up = right cross f. Handle a near-parallel upReference explicitly. In implementation, use the renderer's tested orientation/quaternion functions and document its axis convention. Persist the position and orientation together so restoring a view does not unexpectedly rotate the scene.

### The horizon equation and what it actually measures

The formula already present in docs/WWT_INTEGRATION_PLAN.md and src/hooks/useCameraSync.ts is:

`theta_E = 2 asin(R / (R+h))`

It gives the angular diameter of a spherical Earth as seen from outside it. It is not the camera's field of view, nor does it define a Solar System position. With R = 6,371 km, the apparent Earth diameter is about 140.41 degrees at 400 km altitude and 17.38 degrees at 35,786 km altitude. To make Earth subtend a chosen angle theta_E, invert it:

`h = R / sin(theta_E/2) - R`

For a 30-degree Earth disk, this gives about 18,245 km altitude. This is a useful framing calculation derived from sphere geometry. It assumes a spherical Earth, an unobstructed view toward its center, and no terrain or atmospheric refraction. The actual lens field of view must still be set separately and may include margins.

At aspect ratio A = viewport width / height, a perspective camera's horizontal and vertical FOV are related by:

`FOV_horizontal = 2 atan(A tan(FOV_vertical/2))`

Use the actual renderer frustum to obtain FOV. Automatically turning every globe altitude change into telescope zoom conflates two controls that users may reasonably want to operate independently.

### Looking at the sky from Earth

Right ascension alpha and declination delta describe a direction on the celestial sphere. Right ascension is often written in hours: 24 hours = 360 degrees. A unit direction in a matching equatorial frame is:

`n = [cos(delta)cos(alpha), cos(delta)sin(alpha), sin(delta)]`

For a simplified Earth observer calculation, let theta_G be Greenwich mean sidereal angle and lambda be east longitude. The hour angle is H = theta_G + lambda - alpha. At latitude phi, the geometric altitude above the local horizon is:

`alt = asin(sin(phi)sin(delta) + cos(phi)cos(delta)cos(H))`

An azimuth measured eastward from north can be obtained as:

`az = atan2(-cos(delta)sin(H), sin(delta)cos(phi)-cos(delta)sin(phi)cos(H))`

Normalize azimuth to 0–360 degrees. These explanatory formulas need coordinates on the same equator/equinox; do not mix raw J2000 positions with date-based sidereal rotation. Accurate operation needs a proper frame transformation including time scales, precession/nutation and, where appropriate, parallax, refraction and Earth orientation. Astropy's EarthLocation and AltAz provide reference behavior for verification. [S10]

The current earthObserverProjection.ts calculates a sky direction's Earth subpoint using longitude approximately alpha - GMST and latitude approximately delta. That is the location where this direction is near the zenith in a simplified spherical model. It is not the celestial body's physical location on Earth. Label this as a direction projection or zenith subpoint.

From an orbital camera, the ground horizon is lower than a surface observer's horizontal plane. The ideal geometric horizon dip is acos(R/(R+h)). Use a ray-versus-Earth/terrain occlusion calculation for whether a body is blocked; checking only alt >= 0 applies to a simplified surface observer. Keep optional educational see-through overlays visibly distinct from a physically occluded view.

### Camera position relative to the Solar System

Choose a single inertial coordinate frame, a time scale and a distance unit. In this proposed contract, body ephemerides and global camera positions use an ICRS-aligned barycentric frame in kilometers. A camera attached to Earth becomes:

`c_B(t) = p_Earth,B(t) + Q_EarthFixed_to_Inertial(t) c_E`

Here p_Earth,B is Earth's barycentric center, c_E is the Earth-fixed camera offset, and Q transforms that offset into the inertial frame at time t. For a camera near another planet, replace Earth with that body and use its correct body-fixed rotation model. Never add a meter-valued Cesium vector directly to a kilometer or astronomical-unit ephemeris vector.

The geometric vector from the camera to target T is q = p_T,B(t) - c_B(t). Apparent observation also accounts for light travel time: q = p_T,B(t-tau) - c_B(t), with tau = length(q)/c_light, solved iteratively. Derive RA = atan2(q_y,q_x), Dec = atan2(q_z,sqrt(q_x^2+q_y^2)), and range = length(q). These are proposed frame-explicit formulas; the WWT engine has its own internal conventions, so the adapter must convert rather than assuming its internal vectors already match this frame. JPL SPICE documents observer-to-target states, reference frames, and aberration corrections. [S11]

For educational approximate motion, the existing astronomy.ts uses Keplerian orbits: solve E - e sin(E) = M, form orbital-plane coordinates x = a(cos(E)-e), y = a sqrt(1-e^2)sin(E), then rotate by node, inclination and periapsis into the chosen ecliptic frame. This source is an approximation, not a complete precision ephemeris. Keep physical body positions separate from optional exaggerated display radii. Use floating origins or the renderer's precision strategy when moving from meter-scale Earth detail to astronomical distances.

### WWT API units and synchronization issues

CenterOnCoordinatesMessage uses RA/Dec, vertical FOV and roll in degrees. Lower-level gotoRADecZoom takes RA in hours and zoom equal to six times the vertical FOV in degrees. Keep these adapters distinct. The current preset-message path correctly converts RA hours to degrees despite its nearby comment. [S2, S3]

Inbound ViewStateMessage uses raRad, decRad, fovDeg, rollDeg, sessionId and clock fields, with type wwt_view_state. The local listener expects different fields, leaves RA units ambiguous, lacks origin/source checks and is invoked without a callback. The official message name is correct; the local payload contract is not. [S4]

The outbound callback also disagrees: useCameraSync.ts sends a string plus arguments to a function expecting one message object. Repair both contracts before claiming camera sync.

## Implications

### How constellations should be seen

An IAU constellation is an area of sky; its familiar connecting lines are a visual convention. Stars in one line figure can lie at very different distances. IAU recognizes 88 constellations, and no single official stick-figure design is prescribed. [S12]

In Earth sky mode, render catalog directions as a distant sky backdrop with the appropriate frame/time transformation. Keep names, connecting figures, boundaries and optional artwork as separately toggleable overlays. Label only the selected region and a manageable set of nearby bright objects. Avoid drawing every object label over the same pixels.

For travel around the Solar System, distant stars can remain an effectively infinite backdrop for an educational display; nearby-body parallax, phase and occultation should change correctly. In interstellar travel, the classic Earth-based constellation patterns distort: use distance-bearing star positions and proper motion where available, or explicitly label the backdrop as Earth-referenced. A finite sphere only about 100 million meters from Earth, as used by the current native layer, is a rendering convenience and produces artificial parallax if the camera travels far from Earth.

The current native layer seeds synthetic stars for visual context and the committed constellation boundary dataset contains only three simplified rectangular extents. They must not be presented as a complete measured star catalog or full IAU boundary map. Keep a visible data-coverage statement until authoritative replacements are installed.

### How planets nebulae and other bodies should be seen

Planets and moons need time-dependent centers, body rotations, surface maps, lighting from the Sun and an explicit physical-versus-exaggerated scale choice. A surface image is not a live weather feed. A sky photograph needs an astrometric footprint and orientation; nebulae and galaxies should appear in the correct sky direction and angular extent. X-ray, infrared, radio and other false-color composites need a band/processing label. Preserve scientific image colors and credits when changing the app's accent palette.

Show whether a view is Earth-based sky imagery, a modeled Solar System scene, or a schematic fallback. Save the observer, frame, time, target, lens, survey and installed pack version when the user bookmarks a view. A screenshot alone cannot reproduce its scientific state.

### What the WWT media catalog contains

WWT is a collection of catalogs and data services, not a single folder of photographs. WTML XML describes folders, places and ImageSets; entries may point to another collection rather than contain image bytes. An ImageSet describes its reference frame, band, projection, tile URL pattern, level metadata, orientation and credits. TOAST tiles map a sphere into a square pyramid; tangent-plane image studies and HiPS datasets require their own projection/tiling rules. WTT files describe tours, which may reference other images, overlays or media. Original scientific data such as FITS may be separate from the display tiles. [S1, S5, S6]

The fetched WorldWideTelescope/wwt-core-catalogs snapshot contains 45 imageset XML files totaling 4,240,746 bytes and 4,169 ImageSet definitions. Of those, 4,016 are Sky, 64 Planet, 9 Earth, 79 Panorama and 1 SolarSystem. There are 4,168 distinct nonempty URL strings; different URLs may still represent related or overlapping observations. Places metadata occupies about 2.55 MB in 28 repository files. These counts describe this core repository snapshot, not every WWT-accessible external catalog, tour or tile. The full attribute inventory is saved in research/imageset-inventory.csv. [S6; fetched snapshot]

The band inventory is 4,035 Visible, 49 IR, 31 Microwave, 20 XRay, 11 Radio, 11 Ultraviolet, 9 Gamma, 2 VisibleNight and 1 HydrogenAlpha. A single body may appear in several entries at different wavelengths, dates or surface products. For example, the Mars catalog includes a sparse Mars Orbiter Camera layer with TileLevels 16 and a separate visible basemap with TileLevels 8. That field is endpoint metadata, not a promise that every tile exists or a universal definition of the inclusive L used in this report's calculations.

### Are the media updated

The core catalog repository's latest commit returned by GitHub at retrieval is 2c7d96f14bae041501943b9281f71a84a5310f6e, dated 15 June 2026, merging removal of HiRISE entries. The maintenance workflow supports additions, corrections and removals. This establishes catalog activity, not daily imagery refresh or a guarantee that the running hosted app already uses that exact commit. [S6; saved catalog-snapshot.json]

Five directly sampled level-zero tile responses ranged from 52,685 to 142,455 bytes. Their Last-Modified dates were 2019–2022: Pluto New Horizons Enhanced Color, two Charon products, a Crab Nebula study and SN 1987A. HTTP dates describe the served file version; they do not establish the original observation date. They demonstrate why a recently maintained catalog can contain old, scientifically valuable observations. Responses reported both image/png and application/octet-stream, so imports should inspect file signatures as well as MIME labels. The sample is small and not representative of every level or survey; raw measurements are retained in research/tile-samples.json.

Store at least observedAt or observationRange, publishedAt when available, upstreamVersion, fetchedAt, checkedAt, ETag/Last-Modified and a content hash. Display Unknown when observation dates are absent. Refresh metadata conditionally, show update differences, and let users keep a pinned offline version. A live Solar System animation can update its calculated positions continuously while using unchanged historical surface textures.

### How large one image can be

All capacities use decimal units: 1 GB = 1,000,000,000 bytes and 1 TB = 1,000 GB. The ranges are planning scenarios, not measured totals for a named celestial body. The tile-pyramid calculations explicitly define their coverage and maximum included level below.

| Asset | Illustrative size | Basis and limit |
| --- | --- | --- |
| Thumbnail | 10–300 kB | Planning allowance; depends on dimensions and compression |
| One 256 by 256 tile | 20–150 kB scenario | Five actual sampled roots were 52.7–142.5 kB; other tiles can exceed this range |
| 2048 by 2048 JPEG or WebP image | About 0.3–5 MB | Planning range, not a measurement of a named WWT image |
| 8192 by 8192 image | About 5–100 MB compressed | Raw RGB is 201 MB; compression varies substantially |
| 16384 by 16384 scientific image | 1.07 GB per float32 plane uncompressed | Width times height times four bytes; cubes and multiple planes multiply this |
| Decoded 4K RGBA texture | 67.1 MB before mipmaps | GPU/RAM budget is separate from compressed disk size; full mipmaps add about one third |

A downloaded tile is a piece of an image, not a separate telescope observation. Storing all zoom levels adds lower-resolution copies. Large scientific originals and derived tiles can both be retained, but counting both increases the disk requirement.

### A complete tile pyramid at all included zooms

For an ideal complete single-root quadtree, level L has 4^L tiles. Including every level from 0 through L gives:

`N_total(L) = (4^(L+1) - 1) / 3`

`B_total = sum_over_levels(N_level * mean_bytes_at_that_level)`

The table assumes a constant 20–150 kB per tile, with 50 kB as a comparison point. WWT documents 256 by 256 TOAST tiles and quadrupling the tile count at each subdivision. Sparse images, clipped footprints, multiple roots and HiPS change the count; these are idealized planning calculations. [S5]

| Deepest inclusive L | Tiles at all levels | At 50 kB per tile | Range at 20–150 kB |
| --- | --- | --- | --- |
| 5 | 1,365 | 68.3 MB | 27.3–204.8 MB |
| 7 | 21,845 | 1.09 GB | 0.44–3.28 GB |
| 8 | 87,381 | 4.37 GB | 1.75–13.11 GB |
| 9 | 349,525 | 17.48 GB | 6.99–52.43 GB |
| 10 | 1,398,101 | 69.91 GB | 27.96–209.72 GB |
| 11 | 5,592,405 | 279.62 GB | 111.85–838.86 GB |
| 12 | 22,369,621 | 1.12 TB | 0.45–3.36 TB |
| 14 | 357,913,941 | 17.90 TB | 7.16–53.69 TB |
| 16 | 5,726,623,061 | 286.33 TB | 114.53–859.00 TB |

One extra level roughly quadruples the highest-resolution storage. All ancestor levels together add about one third above the deepest level alone. Include a further planning reserve for metadata, file-system allocation, temporary downloads and old versions; 10–20 percent is an initial allowance, and atomic upgrades can temporarily require a second copy of a pack. Millions of tiny files can incur more overhead, so measure the chosen storage layout.

For a square image tiled into a complete 256-pixel pyramid, a 2048-pixel study has 85 tiles or about 4.25 MB at 50 kB per tile; an 8192-pixel study has 1,365 tiles or about 68 MB; a 32768-pixel study has 21,845 tiles or about 1.09 GB. A collection of 100 such 8192-pixel studies would be about 6.83 GB for display tiles at that assumption. This is different from a whole-planet or whole-sky surface at a specified angular resolution.

### Sections bands bodies and the entire collection

For a uniformly sampled spherical dataset, a circular section of angular radius rho covers fraction f = (1-cos(rho))/2 of the sphere. A 10-degree-diameter field has f about 0.001903. At the level-12 midpoint scenario, its proportional tile storage is roughly 2.13 GB before ancestor/boundary padding and source-specific projection effects. One percent of a level-10 complete layer is about 0.70 GB; one percent at level 12 is about 11.18 GB at the midpoint. Actual download planning must enumerate intersecting tiles, not rely only on surface-area fractions.

Multiple wavelength bands, dates, elevation products and alternative maps multiply the budget. Ten complete level-10 layers would be roughly 0.28–2.10 TB; 100 such layers would be roughly 2.8–21 TB. These are scenarios for equally deep full layers, not estimates obtained by multiplying every catalog entry by a planet-sized map. Most photographic studies have smaller footprints and different resolutions.

There is no defensible exact GB total for all WWT imagery from the metadata alone. WWT's own planetarium guide describes access to petabytes of cloud image data, across distributed sources. A petabyte is one million GB. An offline mirror of all externally reachable surveys, dates, studies, source originals and tours would need a frozen scope and an actual asset crawl with byte counts, deduplication, availability checks and per-source permission. [S7]

## Recommendations

### Design integration with Silver Wolf VI in plain language

Make the telescope feel like another workspace in the same application. Keep the same navigation, control geometry, typography and primary purple action color. Use cyan sparingly to distinguish the active spatial task and selected targets. Keep the sky or planet visually dominant; panels should explain the current view and offer the next useful action without covering it. Preserve the actual colors of photographs and explain wavelength processing instead of applying the app's purple theme over the science imagery.

The operator should always be able to read: where am I observing from, which object is selected, what time is simulated, which imagery layer is displayed, and whether that imagery is local, online or missing. Present everyday wording first and put frame IDs, RA/Dec and ephemeris version in an expandable technical detail area. Keep a single clear mode selector and one timeline; avoid the earlier pattern of a floating switcher overlapping the chat or telescope header.

### Palette typography form and layout in technical terms

| Surface or role | Silver Wolf integration expectation | Implementation intent |
| --- | --- | --- |
| Workspace base | Near-black #0A0B10 | Use the active theme token; keep media un-tinted |
| Primary action | Purple #8A5BC7; hover #A67BEA | Selection and actions, not wavelength or physical brightness |
| Spatial accent | Cyan #A3E4D7 | Selected object/focus cues; maintain shape/text cues too |
| Content | Main #EAECEE; muted #85929E | Check contrast on final composited surfaces, especially muted labels |
| Panels | Runtime holographic panel rgba(15,17,26,0.5), strengthened by readability settings | Favor opaque-enough working panels; check the final hook/CSS values rather than freezing one opacity |
| Type | Inter for UI; configured monospace for coordinates/time | Body/control text around 14 px, metadata 12 px as proposed baseline; honor text scale |
| Form | Shared radius near 10 px; existing spacing rhythm | Use common button/panel primitives and existing z-index tokens |

These palette values come from the current holographic theme source, not from the divergent blue Tailwind token file. They describe a default, not a mandate to override user-selected palettes. Scientific signal colors and error/warning/success roles need separate semantics. Validate contrast for focused, selected, disabled and over-media states rather than assuming hex values alone establish accessibility.

Use a canvas plus collapsible tool regions: compact object/search region on the left, one selected-object inspector on the right, and a compact time/observation strip below. On narrow screens, use drawers or sheets and reserve the full canvas width; do not preserve desktop fixed-width side panels. Keep a visible target marker, avoid label collisions, and expose a north-up/reset-view action. Prefer real surveyed star colors and brightness mapping over decorative color coding; offer reduced motion and a plain cursor for long observation sessions.

### Proposed integration contract

Persist one camera/observation state containing mode, frame identifier, camera position with units, orientation, target ID, observer location, UTC display time, ephemeris/time-scale metadata, vertical FOV degrees, roll, selected survey ID and offline pack version. Own new state in src/core/state as the repository guidance requires. Use a WWT adapter for message units/protocol and a Cesium adapter for rendering coordinates. Keep user interface state and the bytes of image assets out of the camera contract.

Choose one primary render owner per mode. WWT's own engine is the most direct route to retaining WWT survey, tour and planetary behavior under a custom UI. A native Cesium sky is viable but must separately implement the required astronomy projection, imagery tiling and scientific rendering behavior. Self-hosting the Research App is another supported route; a custom fork can change its internal look. The existing remote iframe remains dependent on its remote origin and cannot be fully restyled from Silver Wolf CSS. [S8]

### Local drive storage and updates

For the stated goal of cloneable offline use, make ordinary versioned pack files on disk the authoritative media store. A local loopback server can serve the built app, renderer dependencies, pack manifests and image tiles without internet. If packaged as a desktop app, keep packs in an application data directory; in a development checkout, a configured data directory can serve the same purpose. Do not require the assistant Bridge or a cloud provider merely to inspect a local sky pack.

Keep metadata in SQLite for a desktop/local service or IndexedDB for a browser deployment. Browser Cache Storage/OPFS can serve as optional managed storage, with quota handling and explicit export. Site storage is origin-specific and can be cleared; copying a Git repository does not copy a browser profile's cache. A portable installation must include pack files, bundled fonts/scripts, manifests and ephemerides needed for the supported time range. [S13]

An offline pack should record asset ID, byte length, SHA-256, source URL, license/credit, acquisition date/range, projection, tile addressing, level convention, sky or surface coverage and version. Resolve all WTML dependencies, including nested folders, thumbnails and tile templates, into an explicit local URL map. Validate imports and stage downloads before activation; preserve the last good version when an update is interrupted. Include controls to inspect installed size, pin a version, update deliberately, remove optional packs and export a copy.

### Implementation sequence and acceptance gates

First, repair the camera adapter's message fields, degree/radian/hour conversions, callback signature and origin/source checks. Define Earth, observer sky and Solar System modes with one clock and a documented frame transform. Verify known coordinate cases, horizons, and mode restoration before enabling automatic camera coupling.

Second, install a small real media pack: a catalog, a few verified thumbnails and one survey/body layer with a bounded resolution. Confirm the chosen renderer can actually display those assets. Add pack inventory and a visible unavailable state instead of a substitute band or a forever-loading panel.

Third, apply the shared palette, panels, typography, spacing and responsive design. Keep imagery colors intact. Verify desktop and mobile views, keyboard focus, large text, reset/recenter, reduced motion, and label density against an approved visual target.

Finally, prove offline operation from a cold application start with external networking disabled: select a local object, pan and zoom throughout the installed coverage, change time within the ephemeris range, restart, and restore the view. List any uninstalled coverage explicitly. Increase resolution or add wavelength/date packs only after measuring disk, RAM/GPU, startup time and download duration.

## Appendix

### Local document and implementation index

| Local source | Relevant information |
| --- | --- |
| DESIGN.md | Shared palette roles, typography, layout, motion, responsive and accessibility expectations |
| DOCS.md | Architecture notes, planet targeting and precession/sidereal integration descriptions |
| docs/WWT_INTEGRATION_PLAN.md | Historical mixed WWV/WWT plan; explicit horizon equation and proposed camera hooks |
| docs/WWT_INTEGRATION_PREPARATION.md | Earlier integration gaps, hybrid architecture proposal, local storage phases |
| docs/ASSET_DATA_ARCHITECTURE.md | Local catalog/preview policy, simplified boundaries and unimplemented tile cache |
| docs/ARCHITECTURE_LEARNING.md | Learning workspace architecture and renderer context |
| docs/project-report-2026-06-23.md | Earlier astronomy implementation and validation claims; historical evidence |
| docs/SilverWolf_Theme_Engine.md | Theme rationale and exploratory roadmap |
| docs/manual/Operator-Manual.md | Provisional capability audit, not a current end-user manual |
| docs/design-audit-2026-10-26/README.md | Earlier screenshots and workflow observations; not new visual evidence in this report |
| src/hooks/useCameraSync.ts and useWWTListener.ts | Altitude/FOV math, camera callback and inbound message contract |
| src/lib/earthObserverProjection.ts and coordinateTransforms.ts | GMST, subpoint, sky direction and precession utilities |
| src/lib/astronomy.ts and src/data/telescopePresets.ts | Approximate planetary positions, light-time and catalog targeting |
| src/core/celestial and src/hooks/cesium/useConstellations.ts | Native sky, local catalogs, boundaries and media-pin behavior |
| src/lib/themeEngine.ts and src/index.css | Actual active theme tokens, spacing, typography and z-index rules |

### Research evidence and limits

Design QA applies when an approved visual target and matching rendered telescope UI exist. This research report defines expected behavior but does not claim a prototype fidelity pass. A later implementation must compare fonts, spacing, colors, imagery and copy in the same viewport/state. Document rendering fidelity is checked separately against the retained Design Report template.

The current research covers the local source/documents and primary WWT, IAU, ESA, JPL and browser-storage documentation. The GitHub snapshot and five tile fetches were taken during this report and are reproducible from saved URLs and commit. This is an integration and media research exercise; there are no new user interviews, usage-frequency estimates or accessibility certification claims. No bulk imagery mirror or new application implementation was performed.

The core metadata inventory CSV lists all 4,169 definitions fetched from the 45 imageset XML files. JSON captures the commit, counts and sampled tile headers. The storage-estimates CSV contains the exact arithmetic behind the illustrative complete-pyramid scenarios. A directory inventory or catalog entry count is not a storage measurement for all referenced images.

### Sources

[S1] WWT Data Guide, data file formats. https://docs.worldwidetelescope.org/data-guide/1/data-file-formats/

[S2] WWT CenterOnCoordinatesMessage. https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/research-app-messages/interfaces/classicPywwt.CenterOnCoordinatesMessage.html

[S3] WWTControl API and gotoRADecZoom. https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/engine/classes/wwtcontrol.html

[S4] WWT ViewStateMessage. https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/research-app-messages/interfaces/ViewStateMessage.html

[S5] WWT TOAST projection and image pyramids. https://docs.worldwidetelescope.org/data-guide/1/spherical-projections/toast-projection/

[S6] WWT core catalog repository and pinned snapshot. https://github.com/WorldWideTelescope/wwt-core-catalogs/tree/2c7d96f14bae041501943b9281f71a84a5310f6e

[S7] WWT Planetarium Guide, data caches. https://docs.worldwidetelescope.org/planetarium-guide/1/caches/

[S8] WWT embedding and engine models. https://docs.worldwidetelescope.org/research-app/latest/embedding/ and https://docs.worldwidetelescope.org/webgl-reference/latest/getting-started/embedded-app-model/

[S9] ESA Navipedia, Cartesian and ellipsoidal coordinates. https://gssc.esa.int/navipedia/index.php/Cartesian_and_ellipsoidal_coordinates

[S10] Astropy AltAz and Solar System coordinate references. https://docs.astropy.org/en/stable/api/astropy.coordinates.AltAz.html and https://docs.astropy.org/en/stable/coordinates/solarsystem.html

[S11] NASA JPL NAIF, SPICE state vectors. https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/spkezr_c.html

[S12] International Astronomical Union, the constellations. https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx

[S13] MDN storage quotas and eviction. https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
