# Advertised features and actual implementation

Source audit, 6 November 2026. This distinguishes missing functionality from
implemented code that needs a service or credentials. The feature roadmap is a
proposal, not evidence that its features already exist.

| Feature or broad claim | Actual state | Evidence / remaining work |
| --- | --- | --- |
| Live aircraft tracking | Static sample layer | `src/plugins/aviation/WwvAviationPlugin.ts` marks its fixtures `liveTelemetry: false`. A real ADS-B ingestion service is still needed. |
| Detailed multi-wavelength imagery inside the shared world globe | Partial | `useWorldSurvey.ts` loads a low-resolution DSS overview and explicitly reports detailed tiles as pending. The native survey registry mainly supplies metadata/palettes. The separate WWT explorer uses WWT's own online imagery engine. |
| Full offline sky imagery and downloadable packs | Not implemented | `public/astronomy/surveys` and `media/thumbnails` contain README files, not installed imagery. There is no versioned tile-pack downloader/cache manager. Catalogue positions are available offline; complete imagery is not. |
| Complete offline IAU constellation boundaries | Seed only | `constellationBoundaries.json` contains three simplified extents. The Python path can fetch WWT geometry online; that is separate from a complete bundled IAU dataset. |
| All native sky points represent measured stars | Not true for the decorative layer | `useNativeCelestialSky.ts` generates 640 procedural points. The Python geometry path uses a real bright-star catalogue when available; the WWT engine uses its own sky data. |
| A single fully reconciled observer/time/camera model | Partial | WWT and the astronomy service accept observation UTC. Some legacy native drawing still uses wall-clock time. Full apparent-position, parallax and camera-frame agreement has not been established. |
| Current asteroid orbit and spin | Not implemented | Bennu is an inspection model. Its placement/lighting is illustrative; controls explicitly disclose that orbit/spin are not simulated. |
| AI can inspect the entire screen | Partial | `visualInspectorService.ts` captures an accessible canvas or creates a schematic preview. `buildDeveloperVisionContext()` supplies textual metadata. This is not a complete screenshot-to-vision-model workflow. |
| Every configured connector is a complete app integration | Registry/probes exist; feature workflows vary | `apiConnectorEngine.ts` defines capability descriptors and probes. A successful credential probe does not implement every advertised provider capability. Verify each actual workflow separately. |
| Cloud AI / Odysseus memory are always active | Implemented but conditional | A model runtime or provider key/model pair is required; vector memory also needs Odysseus/ChromaDB. Static Pages does not host those processes. The diagnostic assistant is a fallback. |
| Precise observer calculations and planet positions on Pages | Implemented service, separate hosting required | `bridge/astronomy_api.py` provides these routes. Configure `VITE_ASTRONOMY_URL` and the service CORS origin. WWT sky browsing itself no longer depends on this backend. |
| Sentry and CodeRabbit are fully operational | Configuration still required / hosted result absent | Browser Sentry delivery is implemented, but the intended project/DSN and hosted ingestion remain unverified. CodeRabbit policy exists; app access and a hosted review still need confirmation. |

Existing Earth tours, local chat history, favourites and UI controls should not
be described as missing merely because the roadmap proposes extensions to them.
Likewise, simulated ISS fallback is labelled and coexists with real telemetry;
it is not evidence that all satellite functionality is simulated.

## WWT integration delivered in this pass

- A visible **Open WWT explorer** link in the main Telescope controls.
- An authentic bundled WWT catalogue: 88 constellations and 89 regions, including
  both parts of Serpens. Browsing does not require Python.
- Reuse of WWT's singleton canvas after mode switches/retries, with only the
  mounted viewport owning a render loop.
- Native sky/solar views, observation time/location controls, and solar recenter
  on the selected body. Unknown surveys show an error instead of silently
  retaining an unrelated image.
- WTML loading waits for an engine completion callback; embedded loading waits
  for the matching completion message. Unconfirmed imports time out.
- Embedded readiness requires WWT's documented ping/pong, and inbound messages
  must match the actual iframe window and origin. View-state radians are decoded
  explicitly; camera commands use the documented object message shape.

Automated tests validate these integration contracts. Browser policy previously
blocked the local and deployed preview, so visual/interaction verification of
the live renderer remains outstanding. This is a completed code pass for the
online WWT path, not proof that every offline/scientific feature above is done.

References: [WWT engine initialization](https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/engine/classes/WWTControlBuilder.html),
[embedded API readiness](https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/research-app-messages/interfaces/pingpongmessage.html),
[view-state units](https://docs.worldwidetelescope.org/webgl-reference/latest/apiref/research-app-messages/interfaces/viewstatemessage.html).
