# Feature roadmap

Proposed order after the cleanup PR. These are planned additions; the integration
work described below is the current implementation scope.

| Priority | Feature | User result | Completion criteria |
| --- | --- | --- | --- |
| 1 | Connection setup and health | One place to connect the assistant bridge, astronomy service and telemetry | Clear configured, reachable and unavailable states; useful retry errors; no production secrets in the browser |
| 2 | Saved workspaces | Restore a globe/telescope view with layers, targets and panel layout | Named save/load/delete; versioned local persistence; validate imported settings |
| 3 | Observation planner | Plan a night around target visibility and local time | Observer location, date/time, altitude visibility and rise/set calculations; clear handling of circumpolar targets; hosted astronomy service required |
| 4 | Live data freshness | Know which globe overlays are current | Per-layer source, last update, stale state and retry; bounded polling with cleanup |
| 5 | Evidence-linked assistant | Ask about a selected object or visible layer | Explicit selected-object context, cited data source/time, streaming cancellation and offline fallback |
| 6 | Favorites monitoring and alerts | Follow objects and events of interest | Extend existing favorites with saved filters and in-app alerts with deduplication; server worker required for alerts while the app is closed |
| 7 | Guided astronomy tours | Learn through a sequence of telescope targets | Pause/resume, captions, camera transitions and keyboard navigation |
| 8 | Shareable views | Open a link to a reproducible view | Versioned URL state for target/time/layers; exclude credentials and private chat |

Build the connection setup first: the planner, live data and assistant features
depend on services being configured and their availability being visible.

Architecture work should accompany those features: keep new state in
`src/core/state`, split large views by responsibility, and standardize the plugin
contract before introducing more data sources. Reduce lint warnings in each
touched area rather than expanding existing large components.

## Integration delivery

- Chromatic: wait for visual test results, require review for changes, and avoid
  automatically accepting a new baseline. Story coverage must grow with features.
- CodeRabbit: explicitly enable automatic review for PRs to main. Hosted review
  still requires the GitHub app to have access to this repository and an active
  account configuration.
- Sentry: use the official browser SDK for diagnostics and error boundaries;
  remain local when no DSN is supplied. Upload source maps from the actual Pages
  build and remove them from the public artifact. Configuration is not proof that
  an event has appeared in the hosted project.
- Astronomy and assistant bridge: separate Python hosting is required for the
  static Pages deployment. Supply the service URL, allow the frontend origin,
  and verify real requests before describing these as live integrations.

See [QA architecture](QA_ARCHITECTURE.md) for setup and verification steps.
