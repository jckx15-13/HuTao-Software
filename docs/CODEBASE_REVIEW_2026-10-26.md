# Codebase practices and integration review

**Review date:** 2026-10-26
**Scope:** Silver Wolf VI root app, the checked-out WorldWideView app and data engine under `../world-wide-view/`, and their documented integration. This is a source/configuration review; it does not claim that live external services or credentials were exercised.

## Executive summary

The codebase has useful foundations: the Silver Wolf VI TypeScript config is already strict, the root includes integration contract checks, the WorldWideView project has its own comprehensive scripts, and visual assets are mirrored locally with a mapping layer. The main risks are misleading integration language, cross-project wiring that assumes filesystem locations, a mix of source evidence and runtime evidence in status reporting, and large files/state layers that increase change risk.

The integration is **partial and conditional**. Silver Wolf VI consumes mapped WorldWideView assets and has a data-engine URL/discovery path. It also declares cross-compatible plugins from a sibling plugin repository. However, the sibling source/bundle paths are not proven available by the root contract check, the seeder repository named in the plan is absent at the expected sibling path, and the bridge ledger does not enumerate the data engine or seeders as repositories. A local manifest probe and a configured cloud URL are not proof that live feeds work end-to-end.

## Evidence-backed integration status

The Developer Panel now exposes three **evidence coverage** bars. The percentage is the fraction of that integration's four named checks currently satisfied; it is not a subjective estimate of total product completeness. Based on the present checkout, the expected readings are **Silver Wolf VI core 50%**, **WorldWideView 75%**, and **WWV data engine + seeders 75%**. Each is short of full evidence because this checkout has no fresh runtime report proving the relevant live flow. The seeders bar credits the actual `worldwideview/local-seeders/community` source directory, while the repository inventory separately shows that a standalone `wwv-seeders` checkout is absent.

| Area | Observed evidence | Accurate status |
|---|---|---|
| Silver Wolf VI ↔ WorldWideView assets | `src/assets/wwvVisualAssets.ts` maps WorldWideView asset paths and local copies; `scripts/test_integration_contracts.cjs` validates mapped assets. | **Source and asset integration present.** Runtime freshness/provenance of copied assets is not established by this check. |
| Silver Wolf VI ↔ WorldWideView plugins | `src/core/plugins/wwvCrossCompatLoader.ts` lists five bundle paths under `../world-wide-view/worldwideview-plugins/.../dist/frontend.mjs`; loader catches failures and defers them. | **Declared, conditional integration.** Build outputs and successful load are not established by that source list. |
| Silver Wolf VI ↔ WWV data engine | `src/core/data/resolveEngineUrl.ts` uses a configured/default cloud WebSocket URL and `engineManifest.ts` probes a local engine on port 5000. | **Routing/discovery source exists.** Live endpoint, credentials, seeder availability, and successful entity flow require runtime verification. |
| Seeders | The `wwv-data-engine` checkout contains a `seeders/` directory with only `.gitkeep`; WorldWideView contains `local-seeders/community/`. No `../world-wide-view/wwv-seeders` checkout exists. | **Separate seeder repository not checked out at the plan's expected path.** Seeder availability cannot be inferred from the root app. |
| Bridge integration ledger | `bridge/server.py` reports the root, WorldWideView, data-engine, standalone seeder, and Odysseus paths. It now returns evidence bars for the three product integrations. | **Inventory and per-integration evidence bars implemented; live flow remains unverified.** |
| WorldWideView integration plan | `docs/WWT_INTEGRATION_PLAN.md` calls its inventory exhaustive and implies target files/asset paths. The current root architecture and mappings show a number of those claims are stale or target paths do not exist as described. | **Plan needs revision and explicit evidence/status labels.** |

## Best practices to implement

### Language and compiler configuration

- Keep TypeScript as the default for application code. The root already has `strict`, `noImplicitAny`, `strictNullChecks`, `noImplicitReturns`, `noUncheckedIndexedAccess`, and unused checks enabled in `tsconfig.json`; avoid reporting strict mode as wholly absent. The actionable work is to remove remaining `any`/unsafe assertions, resolve lint errors, and align dependency/tool versions deliberately across separate projects rather than forcing them to match.
- Introduce stricter options only in small steps when they add a specific guarantee. TypeScript documents `strict` as a family of checks that can surface new errors on compiler upgrades; in this checkout it is already enabled. [TypeScript `strict` option](https://www.typescriptlang.org/tsconfig/strict)
- Treat the root Silver Wolf VI app and the two WWV projects as separate package/compiler boundaries. Use their package-manager lockfiles and build scripts; do not claim one root build validates all three.

### DRY and WET

- Apply DRY to **shared knowledge and rules**, not merely similar-looking code. Consolidate duplicated provider/asset/plugin mapping only when the copies encode the same rule and can have one owner.
- Keep code WET (explicit and local) when abstractions would couple independent repositories or hide project-specific behavior. For example, do not create a shared package only to unify similar framework configuration across Vite and Next.js.
- For root integration metadata, prefer a single typed manifest of repository identities, required evidence, and optionality that both the Bridge ledger and integration contract test can consume. Avoid two independent hand-maintained lists that can drift.

### Refactoring and naming

- Refactor behavior-preservingly in small changes, first capturing current behavior with focused checks. Fowler describes refactoring as a sequence of small behavior-preserving transformations; that fits the existing large/active files better than broad rewrites. [Martin Fowler, *Refactoring*](https://martinfowler.com/books/refactoring.html)
- Split oversized components and stores by responsibility as tracked in `AGENTS.md`: `WorldWideTelescopeView.tsx`, `GoogleEarthRemix.tsx`, `LeftPanel.tsx`, `RightPanel.tsx`, `PersonalisationSettings.tsx`, `uiStore.ts`, and `OdysseusConsole.tsx`. Extract hooks/helpers around cohesive behavior, not arbitrary line counts.
- Rename interfaces and status values to say what is actually known. In particular, distinguish `source-backed`, `asset-present`, `configured`, `runtime-verified`, and `stale`; avoid using a generic “verified” for existence checks. Names should communicate scope and evidence, not imply completion.
- Replace hard-coded relative bundle paths in `wwvCrossCompatLoader.ts` with a build/runtime-resolved plugin registry and make availability visible to the UI/ledger. A path declaration is not evidence a built plugin loaded.

### Repository integration and verification

- Define the three-repository boundary precisely: WorldWideView app, WWV data engine, and the seeder source/repository. Record whether the seeders are a separate repository, a nested checkout, or packages within another repository; the current filesystem has multiple arrangements and the plan assumes a separate checkout.
- Track the data engine and seeder source in the integration ledger, including path, expected files, optionality, last-check timestamp, and evidence level. Return `not checked` or `unavailable` when the checkout is absent instead of omitting it.
- Split checks into source-contract checks, package build/type checks, and runtime integration checks. Report each separately; stale reports must remain visibly stale. A source file or successful mock route must not be presented as a live feed verification.
- Add a repeatable integration path that starts the data engine and a known seeder, connects a plugin through the declared URL, and asserts a real test entity reaches the globe/data store. Keep credentials and service availability as explicit prerequisites.
- Keep asset mirroring reproducible: record source revision/hash and regeneration command, and validate the sanitized camera-data transformation as well as file presence.

## Incomplete work, prioritized

1. **Make repository status path/configuration aware.** The ledger now reports the data-engine and standalone seeder paths, but the source workspace keeps community seeders under `worldwideview/local-seeders/community`; keep those two arrangements distinct in future setup/documentation.
2. **Make plugin cross-loading verifiable.** Validate each configured bundle exists, is built, and can register; show failures as unavailable/failed instead of silently treating declared manifests as integrated.
3. **Prove a live data path.** Exercise data engine + seeder + plugin + entity rendering in a controlled integration environment. Current code establishes routing/discovery but this review did not establish a live data flow.
4. **Repair documentation drift.** Replace the “exhaustive” claim in `WWT_INTEGRATION_PLAN.md` with a dated, checked inventory and mark obsolete file paths/architecture claims. Clarify whether “WWT” means WorldWideView or World Wide Telescope throughout; current names overlap.
5. **Reduce change risk in the root app.** Continue legacy store migration/decision, split the listed oversized files, unify the plugin contract, then burn down lint/type debt incrementally. `AGENTS.md` already identifies these as open items.
6. **Make checks reflect project boundaries.** Run each project’s own typecheck/test/build in its own directory where dependencies are installed; the root integration contract is not a substitute for the WorldWideView or data-engine checks.

7. **Enable honest local runtime verification.** The frontend was opened in the in-app browser, but this shell has no `bridge/venv` and system Python lacks `anyio`; therefore `/api/integration/status` could not be served and the new bars could not be visually checked with real Bridge data in this run. Bootstrap the documented Bridge environment, then verify Developer Panel at desktop and mobile breakpoints and run the live data-engine/seeder flow.

## Three-way claim validation

For high-impact statements above, I checked: (1) the documented plan/README/AGENTS text, (2) current source/configuration and filesystem paths, and (3) the integration contract/Bridge ledger logic. Where a runtime execution or external credential was not part of that evidence, the report labels the state as conditional or unverified rather than inferring success.

## Sources

- [TypeScript TSConfig `strict`](https://www.typescriptlang.org/tsconfig/strict)
- [TypeScript compiler options](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [Martin Fowler, *Refactoring: Improving the Design of Existing Code*](https://martinfowler.com/books/refactoring.html)
- [Martin Fowler, “Definition of Refactoring”](https://martinfowler.com/bliki/DefinitionOfRefactoring.html)
