# AGENTS.md — Silver Wolf VI

Read this before touching the codebase. It orients an AI agent (or a new
human contributor) to the architecture, current known issues, and the
in-progress cleanup so work doesn't duplicate or contradict it.

## What this is

Silver Wolf VI is a Vite + React 19 + TypeScript single-page app: a
cyberpunk-styled agentic AI assistant shell (chat, model-agnostic backend via
`bridge/`) fused with **WorldWideView**, a geospatial engine that renders
live data (aircraft, satellites, earthquakes, weather, military bases,
public cameras) on a CesiumJS 3D globe, plus a WorldWide Telescope view for
orbital/interstellar visualization.

- **Frontend**: `src/` — this file's main subject.
- **Bridge**: `bridge/` — a Python FastAPI process the frontend talks to at
  `127.0.0.1:8001` for assistant routing, logging, and Odysseus core
  proxying. Must be running separately (`npm run dev` alone does not start
  it) or the UI shows "Assistant Bridge: OFFLINE".
  - `server.py` — routes, provider chain, Odysseus proxy.
  - `local_llm.py` — Ollama / LM Studio / llama.cpp discovery and model
    selection. Keyless; preferred over cloud providers by default.
  - `hardware.py` — RAM/VRAM probing and the tiered model catalog.
  - See [docs/LOCAL_LLM.md](docs/LOCAL_LLM.md) for the full guide.
- **Dev server**: `npm run dev` (Vite, port 3005).

## Directory map (`src/`)

| Dir | Purpose |
|---|---|
| `components/` | React components: `layout/`, `panels/` (left/right/center workspace panels), `settings/`, `learning/` (globe + telescope views), `common/`, `dev/` (diagnostics UI) |
| `core/globe/` | CesiumJS integration: camera, entity rendering, imagery, frustums, hooks per rendering concern |
| `core/state/` | Zustand store split into slices (`uiSlice`, `dataSlice`, `configSlice`, `globeSlice`, `layersSlice`, `filterSlice`, `timelineSlice`, `favoritesSlice`) — **this is the canonical state layer going forward** |
| `core/plugins/` | The data-plugin framework: `PluginManager`, `PluginRegistry`, `PluginTypes`, manifest loading/validation |
| `core/data/` | `DataBus` (pub/sub for plugin data), `WsClient`, `PollingManager`, `CacheLayer`, `SmartFetcher` |
| `plugins/` | The 7 concrete data plugins: `weather`, `aviation`, `earthquakes`, `satellites`, `military`, `hexagons`, `cameras`, plus `geojson` (import tool) |
| `store/` | **Legacy state layer** — `uiStore.ts`, `diagnosticsStore.ts`, `learningStore.ts`. Still actively used by ~55 call sites; not yet migrated onto `core/state/*`. See "Known issues" below — do not add new state here. |
| `lib/` | Framework-agnostic utilities: math/physics (`physics.ts`), coordinate/projection math, theming, config, AI client |
| `hooks/` | Cross-cutting React hooks (`cesium/*` for globe-specific ones, top-level for app-wide concerns) |
| `wwv-sdk/` | WorldWideView plugin manifest types/contracts, consumed by `core/plugins/` |
| `data/` | Static seed data (satellites, constellations, locations, tours) |

## State management

There are currently **two parallel state layers** — this is a known problem,
not an intentional pattern:

1. `src/core/state/*` — Zustand slices, composed in `core/state/store.ts`.
   Idiomatic, modular. **Use this for any new state.**
2. `src/store/*` — three standalone Zustand stores (`uiStore` is 800+
   lines). Predates the slice pattern. Still has real, active consumers.

Consolidating onto (1) is tracked as pending cleanup work — do not casually
move things between the two without checking all call sites first
(`grep -rl "store/uiStore"` / `"store/diagnosticsStore"` /
`"store/learningStore"`).

## Plugin contract

Data plugins live in `src/plugins/<name>/` and register with
`PluginManager` (`src/core/plugins/PluginManager.ts`). Only `geojson` uses a
declarative `plugin.json` manifest (see `core/plugins/PluginManifest.ts`,
`parseWwvManifest.ts`, `validateManifest.ts`); the other 7 are imperative
classes wired up directly in `PluginManager`. When adding a new plugin,
follow the existing imperative pattern used by a sibling plugin (e.g.
`weather` or `earthquakes`) unless you're also doing the manifest
unification described below.

## Commands

```bash
npm run dev          # Vite dev server, port 3005
npm run build         # production build
npm run typecheck     # tsc --noEmit (was previously mislabeled "lint")
npm run lint           # real ESLint check
npm run lint:fix       # ESLint --fix
npm test               # scripts/test_*.cjs smoke tests

# Bridge (separate process; not started by npm run dev)
cd bridge && ./venv/bin/python3 server.py
./scripts/setup-local-llm.sh --show   # Ollama low-memory settings
```

## Documentation map

| File | Covers |
|---|---|
| `AGENTS.md` | This file — architecture, conventions, open issues |
| `docs/LOCAL_LLM.md` | Local LLM setup, hardware tiers, low-memory tuning |
| `docs/manual/Operator-Manual.md` | End-user operation |
| `docs/ARCHITECTURE_LEARNING.md` | Deeper architecture notes |
| `DESIGN.md` / `design-tokens.tailwind.json` | Visual design system |

## Known issues / pending cleanup (do not re-discover, just pick up)

This repo went through a cleanup pass; the following remain **open**:

1. **State-store consolidation** — migrate `store/uiStore.ts` and
   `store/diagnosticsStore.ts` consumers onto `core/state/*` slices, or
   formally decide they stay separate (e.g. diagnostics/learning as
   intentionally isolated) and document why here.
2. **God-files to split** by responsibility (rendering vs. handlers vs.
   presets/data): `components/learning/WorldWideTelescopeView.tsx` (~1900
   lines), `components/learning/GoogleEarthRemix.tsx` (~1400),
   `components/panels/LeftPanel.tsx` (~1350),
   `components/panels/RightPanel.tsx` (~1200),
   `components/settings/PersonalisationSettings.tsx` (~850),
   `store/uiStore.ts` (~800), `components/dev/OdysseusConsole.tsx` (~800).
3. **Plugin architecture unification** — give all plugins a manifest like
   `geojson`, or drop `geojson`'s manifest and document the imperative
   contract as the standard — pick one.
4. **Lint/type debt** — `npm run lint` currently reports real errors and a
   large volume of `no-explicit-any` / `no-unused-vars` warnings.
   `tsconfig.json` does not have `"strict": true`; turning it on will
   surface more. Fix incrementally, file by file, not in one sweep.
5. **`bridge/` startup** — the frontend expects `127.0.0.1:8001` to be
   reachable. Start it with
   `cd bridge && ./venv/bin/python3 server.py`. No API key is needed when a
   local runtime is available — the bridge prefers Ollama/LM Studio/llama.cpp
   over cloud providers by default. For cloud, copy `.env.example` and fill
   in a provider key. See [docs/LOCAL_LLM.md](docs/LOCAL_LLM.md).
6. **Cruft removal pending** — `.agents/`, `_archive/`, `diagnostics/`,
   `incidents/`, `logs/`, `test-results/`, `correct_changes.patch`,
   `docs/_archive/`, `docs/development_logs/`, `docs/progress.md`,
   `eslint_report.json`, `eslint_summary.json`, `implementation_plan.md`,
   `implementation_plans_log.md`, `patch_check.txt`, `src/purescript/` (72
   files) are excluded in `.gitignore` for anything new, but remain tracked
   from before the cleanup. `src/purescript/` is confirmed dead — nothing
   references it; its math now lives natively in `src/lib/physics.ts`.
   Remove with:
   `git rm -rq --ignore-unmatch .agents _archive diagnostics incidents logs test-results correct_changes.patch docs/_archive docs/development_logs docs/progress.md eslint_report.json eslint_summary.json implementation_plan.md implementation_plans_log.md patch_check.txt src/purescript`

## Conventions

- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
- TypeScript, functional React components, Zustand for state — no Redux,
  no class components in new code.
- Keep new files scoped to one responsibility; this repo's biggest ongoing
  problem is components that grew past 800+ lines by accretion. Prefer
  extracting a hook or subcomponent over adding another branch to an
  existing large file.
