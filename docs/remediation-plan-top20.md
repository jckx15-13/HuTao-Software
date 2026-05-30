Remediation Plan — Top 20 Fixes (prioritized)

This document lists the top 20 fixes to improve reliability, security, accessibility, performance, and maintainability. Each item includes a short rationale and a suggested minimal change or patch.

1) Fix duplicate `vite` dependency and add a baseline `test` script
- Why: Duplicate dependency entries cause install confusion; no test script harms CI.
- Risk: Install failures, inconsistent dev setups.
- Fix: Keep `vite` only in `devDependencies` and add a placeholder `test` script.
- Status: Implemented in `package.json` (removed `vite` from `dependencies`, added `test`).

2) Add `.gitignore` entries for local junk
- Why: Untracked local files clutter `git status`.
- Fix: Add `scratch/` and `correct_changes.patch` to `.gitignore`.
- Status: Implemented.

3) Add basic CI workflow (GitHub Actions) for install, lint, build
- Why: Prevent regressions; enforce reproducibility.
- Patch (suggested):
  - Add `.github/workflows/ci.yml` with node install, `npm ci`, `npm run lint`, `npm run build` steps.

4) Add ESLint + Prettier and formatting/lint scripts
- Why: Enforce code style and catch bugs early.
- Fix: Add `eslint` + `prettier` devDependencies, `npm run lint:fix` script.

5) Add accessibility testing to CI (axe/lighthouse)
- Why: Low accessibility is high-impact for users.
- Fix: Add `axe` or `@axe-core/puppeteer` checks to CI.

6) Add a lightweight test runner placeholder and structure
- Why: No tests exist; setting up baseline improves confidence.
- Fix: Add `vitest` or `jest` devDependency and a skeleton in `src/__tests__`.

7) Introduce a performance budget and bundle splitting
- Why: Large bundles cause poor user experience.
- Fix: Use dynamic imports for heavy modules (Cesium, GoogleEarthRemix) and configure Vite rollup code-splitting.

8) Protect user uploads and markdown rendering
- Why: File imports and Markdown rendering are attack surfaces.
- Fix: Validate file types/sizes on import; use a strict Markdown sanitizer before render.

9) Audit and pin critical dependencies
- Why: Prevent unexpected breaking changes and vulnerabilities.
- Fix: Use `npm audit` and add `package-lock.json` enforcement in CI.

10) Add ErrorBoundary instances across major UI areas
- Why: Single global boundary isn't enough; localize failures.
- Fix: Wrap heavy panels (LeftPanel, RightPanel, CesiumBackground) with `ErrorBoundary`.

11) Introduce virtualization for long lists (satellites, results)
- Why: Avoid rendering thousands of DOM nodes.
- Fix: Use `react-window` or similar in `LeftPanel` and lists.

12) Debounce/throttle high-frequency handlers (mouse/resize)
- Why: Prevent excessive re-renders and CPU load.
- Fix: Apply `throttle`/`debounce` to CustomCursor and similar handlers.

13) Add instrumentation and basic logging (client-side)
- Why: Facilitate issue triage in production.
- Fix: Add a lightweight logger and expose debug mode to collect logs.

14) Create a developer `CONTRIBUTING.md` and `DEV_SETUP.md`
- Why: Improves onboarding and reduces environment issues.

15) Introduce `prefers-reduced-motion` and disable heavy animations
- Why: Accessibility and battery usage.
- Fix: Respect OS-level reduced motion and add global toggle in settings.

16) Sanitize and validate GeoJSON imports
- Why: Prevent malformed data & potential injection attacks.
- Fix: Validate schema and limit feature counts/sizes before load.

17) Add memory/CPU watchdog for expensive background loops
- Why: Prevent runaway CPU usage on low-end devices.
- Fix: Add guardrails in particle/cursor loops to reduce frequency under load.

18) Improve error messages and user-facing recovery steps
- Why: Users need actionable guidance when things fail.
- Fix: Replace raw error dumps with user-friendly descriptions and retry options.

19) Add a baseline accessibility checklist and automated checks
- Why: Ensure basic WCAG conformance.
- Fix: Add `axe` tests and run them in CI on critical pages.

20) Add a docs page mapping global state shape and plugin API contracts
- Why: Reduces coupling and clarifies integration points for contributors.

How to apply and verify (recommended commands)

1. Commit the changes made in this session (package.json, .gitignore, docs):

```sh
git add package.json .gitignore docs/audit-1000-negatives.md docs/remediation-plan-top20.md
git commit -m "chore: initial audit + package.json tidy + docs"
```

2. Create a dedicated branch for the larger changes (CI, ESLint, tests):

```sh
git checkout -b chore/ci-lint-tests
```

Notes
- I implemented the minimal safe edits (package.json and .gitignore) and added the audit/remediation docs.
- For larger automatic code changes (e.g., adding virtualization, sanitizers, CI workflow), I recommend incremental PRs with tests and review.
