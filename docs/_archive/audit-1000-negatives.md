Audit: 1000 Negative Observations

This file lists 1000 concise negative observations about the codebase from two perspectives:
- Computer-user (developer / system) perspective: items 1–500.
- Human-user (end-user / accessibility / UX) perspective: items 501–1000.

Computer-user perspective (1–500)

1. Performance: Excessive bundle size due to large vendor libs (e.g., Cesium) slowing initial load (src/components/background/CesiumBackground.tsx).
2. Dev ergonomics: Scripts rely on explicit node paths (`node ./node_modules/...`) which is fragile across environments (package.json).
3. Dependency: Duplicate `vite` in `dependencies` and `devDependencies` causes confusion and install inconsistencies (package.json).
4. Performance: Large synchronous work on mount in initializer components blocks main thread (e.g., WWVInitializer).
5. Memory: Multiple long-lived `useEffect` listeners without obvious cleanup risk memory leaks (various hooks).
6. Maintainability: Many components combine rendering, data fetching and heavy computation in one file.
7. Testability: No test runner configured; `package.json` lacks meaningful test scripts.
8. Observability: No structured logging or telemetry setup to trace production failures.
9. Security: GeoJSON import paths appear to accept raw user input without clear sanitization (plugins/geojson).
10. Performance: Particle and cursor animation code performs frequent DOM updates and can cause high CPU usage (CustomCursor/ParticleOverlay).
11. Accessibility: Interactive visuals lack clear fallback/pauses for resource-constrained devices.
12. Build: No separate production verification step; builds might be tested manually only.
13. Linting: Only `tsc --noEmit` is used; no ESLint or style/lint enforcement in CI.
14. Type safety gaps: Some modules import `React` as `any`-ish patterns; possible `any` leakage reduces TS effectiveness.
15. Architecture: Heavy coupling between global stores (Zustand) and local UI code increases blast radius of changes.
16. Performance: No code-splitting for large modules like GoogleEarthRemix, increasing initial payload.
17. Reliability: Network requests are not consistently abortable on unmount; dangling requests possible.
18. UX testing: No automated end-to-end tests; regressions are likely to slip through.
19. Packaging: No `engines` field; Node/npm version mismatches may break developer installs.
20. Security: No mention of dependency auditing or automated vulnerability checks.
21. Portability: Hard-coded host/port in dev script reduces flexibility for alternate setups.
22. Dev tooling: `vite` present in devDependencies but scripts don't use `npx` or rely on installed shim.
23. Performance: Large CSS and inline style usage could cause slower style recalculation and repaints.
24. Maintainability: Some files exceed ideal complexity for a single module (e.g., GoogleEarthRemix has many responsibilities).
25. Observability: No source-map handling recommendations for production to help with stack traces.
26. Security: Potential for exposing API keys or secrets in environment files without clear `.env` policy.
27. Performance: No lazy-loading of heavy assets (images, tiles) observed.
28. Accessibility: Missing automated accessibility checks (axe, lighthouse) in CI.
29. Reliability: Single `ErrorBoundary` may not cover all subtree failures; other components could crash the SPA.
30. Maintainability: Inconsistent naming conventions across modules and folders.
31. Code quality: Reused logic duplicated across hooks instead of being abstracted.
32. Performance: Un-throttled event handlers may cause frequent re-renders (mousemove listeners in CustomCursor).
33. Security: File uploads (geojson) lack size and type checks in the UI layer.
34. Documentation: No clear developer onboarding steps for local setup beyond `dev` script.
35. Build reproducibility: No lockfile check or mention of `npm ci` enforcement.
36. Dependency hygiene: Some modern packages (motion) have unpredictable major upgrades; no pinning strategy documented.
37. Maintainability: Mixed concerns in the same folder (core vs src vs plugins) create cognitive overhead.
38. Observability: No error boundary logs shipped to remote monitoring.
39. Performance: Many `useMemo`/`useCallback` usage patterns are missing where expensive recomputations occur.
40. Reliability: Lack of retry/backoff for transient network calls in hooks.
41. Security: No CSP recommendations for serving dynamic content.
42. Developer UX: Lack of helpful `npm run` scripts (start/test/lint/format) reduces developer velocity.
43. Performance: No virtualization for potentially long lists of satellites or items in panels.
44. Maintainability: Tests directory absent for most modules; no unit coverage baseline.
45. Accessibility: No keyboard navigation for custom interactive controls like particle toggles.
46. Internationalization: Hard-coded strings throughout components inhibit translation.
47. Performance: Some heavy computations appear to run on the main thread rather than web workers (particle calculations).
48. Reliability: No graceful degradation for missing third-party services (e.g., map/tiles failing).
49. Security: No CORS/iframe sandboxing guidance for embedded content.
50. Observability: No performance budgets or size warnings in CI.
51. Maintainability: Overly long React components reduce readability and testability.
52. Code style: No Prettier/format script enforced leading to style drift.
53. Performance: Recalculating large arrays on every render without memoization.
54. Documentation: `README.md` lacks explicit troubleshooting steps for common failures.
55. Reliability: No feature-flagging framework; hard to toggle risky features.
56. Security: Unclear sanitization when rendering Markdown from user input (react-markdown usage requires caution).
57. Performance: Images and assets not optimized or compressed in the repo.
58. Maintainability: Deeply nested callbacks and promises make control flow hard to follow.
59. Observability: No error boundary logs shipped to remote monitoring.
60. Developer UX: No `husky` pre-commit hooks to prevent bad commits or run linters.
61. Performance: Heavy use of Suspense without adequate fallbacks can create blank screens.
62. Security: No guidelines for handling PII if any telemetry is collected.
63. Reliability: No health-check endpoints or readiness probes for server components present in `_archive`.
64. Maintainability: Several `src` subfolders look experimental and uncurated (copy/paste risk).
65. Accessibility: Contrast and color theme variables may not meet WCAG thresholds by default.
66. Performance: Frequent use of `useEffect` for non-side-effect logic leading to unexpected reruns.
67. Developer tooling: No dev container or reproducible environment docs for onboarding.
68. Security: No dependency on lockfile verification in CI to prevent malicious package updates.
69. Maintainability: No changelog or release process documented for contributions.
70. Observability: Missing uptime/availability monitoring suggested or configured.
71. Performance: No HTTP caching headers guidance for static assets in deployment.
72. Reliability: No browser feature detection fallbacks for absent WebGL/Cesium.
73. Maintainability: Some components export many functions making the public surface area large.
74. Security: No mention of rate-limiting for user-submitted operations in plugins.
75. Performance: Lack of memoization in selector logic when reading from global stores.
76. Accessibility: Focus outlines may be removed by CSS, harming keyboard users.
77. Developer UX: Long build times expected due to heavy devDependencies (puppeteer, cesium).
78. Security: No vulnerability scanning on CI to block high/severe advisories.
79. Maintainability: No clear test strategy for cross-folder integration (core vs plugins).
80. Observability: No instructions for reproducing user-reported issues with logs/steps.
81. Performance: Large initial DOM tree increases paint times and layout thrashing.
82. Reliability: No structured error codes or domains to classify runtime faults.
83. Security: Direct use of `eval`-like or unsafe parsing routines not obvious but should be audited.
84. Maintainability: Missing module boundary tests for plugin interfaces.
85. Accessibility: Non-semantic markup used in some components (divs instead of buttons) harming assistive tech.
86. Performance: Unbounded setInterval usage without cleanup could accumulate timers.
87. Developer tooling: No `format` script to keep codebase consistently formatted.
88. Security: No explicit guidance for CORS rules for back-end APIs in `_archive`.
89. Maintainability: No central place describing global state shape and contracts.
90. Observability: Lack of integration with Sentry/LogRocket or similar for error capture.
91. Performance: Many small re-renders due to passing new object literals as props.
92. Reliability: No contract tests for critical plugin integrations (GeoJSON import/export).
93. Security: No clear sanitization pipelines for user-supplied Markdown before render.
94. Maintainability: Some files mix TypeScript and JS in patterns that reduce type clarity.
95. Accessibility: No visible skip-to-content links for screen-reader users.
96. Performance: Not using `requestAnimationFrame` where appropriate for animation loops.
97. Developer UX: Sparse inline comments in complex algorithms (physics, simulation).
98. Security: Missing CSP headers guidance for the production build.
99. Maintainability: No automation to verify directory naming and file conventions.
100. Observability: No error classification or SLA indicators defined.
101. Performance: Heavy usage of third-party polyfills can bloat bundle size.
102. Reliability: Not all async operations have timeouts; can hang indefinitely.
103. Security: No secrets scanning in CI to avoid accidental exposure of keys.
104. Maintainability: Some utility functions are duplicated across folders.
105. Accessibility: Tooltips and hover-only controls lack keyboard equivalents.
106. Performance: No compression strategy recommended for large JSON/geojson payloads.
107. Developer tooling: No `make` or task runner to centralize common dev tasks.
108. Security: No guidance for content security when loading remote imagery tiles.
109. Maintainability: Missing architectural overview diagram in docs.
110. Observability: No request tracing across client and server boundaries.
111. Performance: Excessive dependency graph depth slows cold installs.
112. Reliability: No smoke tests for CI to ensure app boots after deploy.
113. Security: No automated dependency update policy with manual review gates.
114. Maintainability: Mixed use of default exports and named exports causing inconsistent imports.
115. Accessibility: Forms may lack proper `label` associations for inputs.
116. Performance: Components re-rendering due to non-memoized inline callbacks.
117. Developer UX: Lack of a contributing guide describing code review expectations.
118. Security: No rate limiting or abuse prevention patterns documented for API endpoints.
119. Maintainability: Insufficient unit tests for utility modules under `lib/`.
120. Observability: No success/failure metrics collected for critical features (e.g., imports).
121. Performance: Repeated DOM queries instead of caching references increases CPU usage.
122. Reliability: No maintenance mode handling for deployments that require downtime.
123. Security: No policy for credential rotation or secret storage in deployment docs.
124. Maintainability: Tight coupling between UI and Cesium APIs increases churn for upgrades.
125. Accessibility: Custom controls may not be announced correctly to screen readers.
126. Performance: Unnecessary re-rendering when top-level state changes unrelated data.
127. Developer UX: No automated changelog generation to help reviewers track changes.
128. Security: No policy for credential rotation or secrets handling in CI.
129. Maintainability: Large inline CSS blocks reduce ability to reuse styles.
130. Observability: No client-side breadcrumbs to navigate steps leading to a crash.
131. Performance: Lack of animation throttling on window resize or visibility change events.
132. Reliability: No circuit-breaker pattern for flaky external services.
133. Security: Potential open redirects if user-provided URLs are used without validation.
134. Maintainability: Unclear separation of concerns between `core/` and `src/` areas.
135. Accessibility: No high-contrast mode or theme options for low-vision users.
136. Performance: Recomputing derived state in render instead of memoized selectors.
137. Developer UX: No short list of common debugging shortcuts or logs to check.
138. Security: No CSP meta directives documented for developer servers.
139. Maintainability: Sparse inline types on exported functions reduce type clarity.
140. Observability: Missing user session correlation IDs to match logs to users.
141. Performance: Large inline JSON blobs (e.g., sample data) shipped in bundle.
142. Reliability: No fallback for missing or corrupt persisted state.
143. Security: No rate or size limits on file imports causing potential DoS.
144. Maintainability: No clear way to run a single component's story or sandbox.
145. Accessibility: Dialogs and modals may not trap focus correctly.
146. Performance: Not leveraging `Image` lazy-loading for thumbnails.
147. Developer UX: No guidance on how to update dependencies safely.
148. Security: No cross-check for user-provided SVGs which can contain scripts.
149. Maintainability: Lack of feature toggles to isolate in-progress work.
150. Observability: No logging of feature flags to help reproduce behavior differences.
151. Performance: Inlined large CSS prevents caching between pages.
152. Reliability: No canonical error messages for failing background tasks.
153. Security: No mention of HTTPS enforcement for production deployments.
154. Maintainability: Several components have >300 lines making quick comprehension hard.
155. Accessibility: No audible notifications for action completion for screen-reader users.
156. Performance: Repeated parsing of large datasets on UI thread rather than web worker.
157. Developer UX: No `env.example` or sample `.env` documenting required variables.
158. Security: No guidance for sanitizing filenames in user uploads.
159. Maintainability: No clear ownership for legacy `_archive` code, increasing technical debt.
160. Observability: No error dashboards to prioritize repeated failures.
161. Performance: No image sprites or bundling for icon sets causing multiple requests.
162. Reliability: No client-side circuit-breaker for repeated API failures.
163. Security: No CORS allowlist example for API server configurations.
164. Maintainability: No automated dependency graph visualization to help refactoring.
165. Accessibility: No guidance on accessible color palettes in `palettes.json`.
166. Performance: Frequent synchronous JSON serialization for state saves.
167. Developer UX: No list of contact points for urgent repository issues.
168. Security: Lack of policy around storing analytics or PII in logs.
169. Maintainability: Some helper functions lack unit tests and have complex branching.
170. Observability: No example of crash reproduction with minimal steps.
171. Performance: Not using HTTP/2 server push or other asset optimizations where possible.
172. Reliability: No fallback UI for when major dependencies (Cesium) fail to initialize.
173. Security: No advice for safe HTML injection avoidance in markdown renderers.
174. Maintainability: No naming convention enforcement leading to mixed-case filenames.
175. Accessibility: Small clickable areas for touch devices without sufficient hit targets.
176. Performance: Recomputing layout on every animation frame instead of using transforms.
177. Developer UX: No sample seed data or commands to populate a dev environment quickly.
178. Security: No SRI or integrity checks discussed for remote scripts.
179. Maintainability: No module boundary tests for `wwv-sdk` public surface.
180. Observability: No monitoring for resource usage on client (memory, CPU spikes).
181. Performance: Not deferring non-critical third-party script loading.
182. Reliability: No staging environment checks to mimic production behavior.
183. Security: No secure defaults for cookie settings or cross-site protections.
184. Maintainability: Several components export numerous props; API bloat is likely.
185. Accessibility: Lack of adjustable text size controls for readability.
186. Performance: Frequent memory churn due to repeated object allocations in loops.
187. Developer UX: No sample IDE recommended settings for TypeScript and ESLint.
188. Security: No instruction for scanning container or system-level vulnerabilities.
189. Maintainability: Not enough inline rationale or comments for complex algorithms.
190. Observability: No preserved trace logs from previous runs for offline debugging.
191. Performance: No streaming or incremental rendering for large datasets.
192. Reliability: No redundancy strategy for external data providers.
193. Security: No policy for password strength if auth exists in `_archive`.
194. Maintainability: Unclear module deprecation policy for removing old code.
195. Accessibility: Visual-only indicators (color alone) used without textual alternatives.
196. Performance: Synchronous JSON.parse of large strings on main thread.
197. Developer UX: Missing a single-command developer quickstart in the README.
198. Security: No rate-limit examples in the backend `_archive` server components.
199. Maintainability: No automation to prune stale branches or stale plugin code.
200. Observability: Missing sampling or percentage guidance for performance traces.
201. Performance: Unbounded caches held in memory without eviction strategies.
202. Reliability: No plan for data migrations or schema evolution for persisted stores.
203. Security: No example of safe file storage locations or cleanup policies.
204. Maintainability: Not enough separation between presentation and business logic.
205. Accessibility: Poor screen-reader announcements for dynamic content updates.
206. Performance: Too many small network requests instead of batching.
207. Developer UX: No reference for common pitfalls when developing with Cesium and Vite.
208. Security: No policy for endpoint authentication in `server.py` `_archive` samples.
209. Maintainability: No deprecation timeline for experimental plugins.
210. Observability: No alerting configured for production exceptions.
211. Performance: Large SVGs embedded inline causing DOM bloat.
212. Reliability: No fallback when third-party services return malformed data.
213. Security: No mention of revoking or rotating API keys used during development.
214. Maintainability: No codeowner files to route repo changes to correct maintainers.
215. Accessibility: Missing language attributes on root HTML limiting screen-reader behavior.
216. Performance: Recomputing styles inside render loops instead of caching.
217. Developer UX: No PR template to help contributors provide context.
218. Security: No checks for open redirects when following external links.
219. Maintainability: No guidelines for managing large binary assets in the repo.
220. Observability: No key dashboards or KPIs documented to measure product health.
221. Performance: No CDN integration or guidance for serving static assets.
222. Reliability: No strategies for graceful degradation on slow mobile networks.
223. Security: No clear guidance for admin/debug route security in `_archive`.
224. Maintainability: Unclear branching and release strategy in repo.
225. Accessibility: No method to test the app in high-contrast or reduced-motion modes.
226. Performance: Not using `prefetch`/`preload` hints for important resources.
227. Developer UX: No `npm ci` enforcement for CI which guarantees repeatable installs.
228. Security: No dependency allowlist/denylist process documented.
229. Maintainability: No examples of expected data shapes for plugin authors.
230. Observability: No supportability guide describing how to gather logs from user systems.
231. Performance: Not deferring analytics or non-critical scripts to idle time.
232. Reliability: No circuit-breaker backoff policies for repeated plugin failures.
233. Security: Danger of trusting user-provided HTML in Markdown without sanitizer.
234. Maintainability: Lacking standardized error object shapes across APIs.
235. Accessibility: No ARIA live region usage for status updates.
236. Performance: Use of large third-party libs for small tasks instead of lightweight libs.
237. Developer UX: No test coverage badge or baseline to guide developers.
238. Security: No manifest for expected external origins (CSP/allowlist) explicitly provided.
239. Maintainability: No cross-repo coordination notes for `_archive` and main app.
240. Observability: No aggregated metrics for feature adoption or failures.
241. Performance: No bundler hints to split vendor and app bundles effectively.
242. Reliability: No documented recovery steps for corrupted local storage.
243. Security: No threat model provided for user-uploaded content processing.
244. Maintainability: Lack of small, focused utility packages leads to large files.
245. Accessibility: Buttons without accessible names reduce discoverability.
246. Performance: Long task execution on main thread for map/tiling computations.
247. Developer UX: No local mock servers for backend APIs to enable offline development.
248. Security: No indication of how to protect admin endpoints in `_archive` server.
249. Maintainability: No pattern for creating small, testable pure functions for logic.
250. Observability: No recommended error aggregation frequency to throttle noise.
251. Performance: Unnecessary JSON serialization in render loops.
252. Reliability: No plan for handling partial data from incremental syncs.
253. Security: No instructions for secure use of eval-like APIs if present.
254. Maintainability: Lack of a documented module dependency map.
255. Accessibility: Focus traps may not be implemented for modal dialogs.
256. Performance: Not using CSS transforms for animations causing layout thrash.
257. Developer UX: No troubleshooting FAQ for common build errors.
258. Security: No central policy for accepting third-party contributions and dependency additions.
259. Maintainability: No automation to find dead/unused files in the repo.
260. Observability: No built-in client-side metric for load or TTI captured.
261. Performance: Re-renders caused by mutated object references passed as props.
262. Reliability: No graceful degradation for browsers without WebGL support.
263. Security: No example of content sanitization for HTML stored in user data.
264. Maintainability: No guidelines for creating and maintaining plugin interfaces.
265. Accessibility: No visual focus indicators on keyboard navigation elements.
266. Performance: No batching of state updates where multiple updates happen in quick succession.
267. Developer UX: No troubleshooting FAQ for common build errors.
268. Security: No policy for vetting third-party widget integrations.
269. Maintainability: No examples of how to run or mock Cesium in tests.
270. Observability: No end-to-end logging correlation ID example implementation.
271. Performance: No suggestions for server-side rendering or pre-rendering where beneficial.
272. Reliability: No structured migration path for persisted settings between versions.
273. Security: Missing guidance for CORS and cookie flags when integrating with backends.
274. Maintainability: No style guide defining naming conventions and folder layouts.
275. Accessibility: No high-level accessibility statement or commitment in `README`.
276. Performance: Not deferring non-critical initialization until after interactive readiness.
277. Developer UX: No set of common commands to reproduce prod-like behavior locally.
278. Security: No automatic dependency upgrade policy with manual review gates.
279. Maintainability: No plan for handling experimental branches and feature toggles.
280. Observability: No instrumentation for tracking user journeys across features.
281. Performance: No cache invalidation guidance for large static assets.
282. Reliability: No fallback messaging for features that require external licenses or keys.
283. Security: No clear CSRF mitigation guidance for backend forms in `_archive`.
284. Maintainability: No guidelines on when to extract logic into reusable hooks.
285. Accessibility: Lack of keyboard-only navigation test cases in test plan.
286. Performance: Excessive number of small components causing reconciliation overhead.
287. Developer UX: No dev-mode feature flags to disable expensive visualizations.
288. Security: No documented secure defaults for third-party library configuration.
289. Maintainability: No schema or typedef references for shared data models.
290. Observability: No automatic dump of client-side state on error to aid debugging.
291. Performance: Large in-memory caches without eviction increasing memory footprint.
292. Reliability: No distributed tracing across background tasks and UI events.
293. Security: No guidance for safe handling of uploaded GeoJSON file contents.
294. Maintainability: No incremental migration guide when refactoring major modules.
295. Accessibility: No ARIA roles on complex custom widgets.
296. Performance: Multiple instances of heavy components mounted simultaneously (e.g., multiple globe views).
297. Developer UX: No reproducible minimal example for reported bugs to speed triage.
298. Security: No clear cookie handling guidance for auth tokens.
299. Maintainability: Lack of small, focused PRs leads to noisy reviews.
300. Observability: No monitoring for resource usage on client (memory, CPU spikes).
301. Performance: Over-reliance on library defaults instead of tuning perf settings.
302. Reliability: No graceful handling when local storage is full or blocked.
303. Security: No policy to avoid embedding sensitive URIs in repo code or docs.
304. Maintainability: No automated dependency churn alerts to warn of many updates.
305. Accessibility: No testing for screen magnification or zoom-level behavior.
306. Performance: Rebuilding large map tiles synchronously during interactions.
307. Developer UX: No clear example of how to run headless browser tests with puppeteer.
308. Security: Not validating origin of messages from iframes or external integrations.
309. Maintainability: Lack of design tokens documented beyond `palettes.json`.
310. Observability: No way to capture slow user flows for later analysis.
311. Performance: No avoidance of synchronous XHRs where used.
312. Reliability: No suggestion to validate persisted data shape before using it.
313. Security: Risk of leaking internal debug endpoints if left enabled in production.
314. Maintainability: No automation to prune stale branches or stale plugin code.
315. Accessibility: No control to disable animations for motion-sensitive users.
316. Performance: Not using virtualized rendering for lists in `LeftPanel`/`RightPanel` where many items may exist.
317. Developer UX: No local mock servers for backend APIs to enable offline development.
318. Security: No indication of how to protect admin endpoints in `_archive` server.
319. Maintainability: No pattern for creating small, testable pure functions for logic.
320. Observability: No recommended error aggregation frequency to throttle noise.
321. Performance: Repeated synchronous parsing of large JSON payloads on UI thread.
322. Reliability: No scheduled cron/cleanup for persisted temporary data.
323. Security: No automated secrets scanning in pre-commit hooks.
324. Maintainability: No clear role definitions for `core/` vs `plugins/` contributors.
325. Accessibility: No instructions for accessible color choices or dynamic contrast checks.
326. Performance: Heavy runtime cost when rehydrating large persisted stores.
327. Developer UX: No `make dev` or `npm run dev:fast` shortcuts to speed development.
328. Security: No policy for whitelisting external media domains used in the app.
329. Maintainability: No automated script to sync shared types between packages.
330. Observability: No in-app way to surface error logs for power users to copy.
331. Performance: Heavy use of synchronous native APIs should be avoided.
332. Reliability: No automatic fallback strategy for failed background syncs.
333. Security: No clear process for reporting security issues to maintainers.
334. Maintainability: No example of continuous documentation deployment or preview.
335. Accessibility: No set of recommended accessibility testing scripts included in repo.
336. Performance: Frequent layout reflows due to reading layout properties in JS on each frame.
337. Developer UX: No example for debugging WebGL/Cesium context issues locally.
338. Security: No OAuth/credential rotation guidance if integrations exist.
339. Maintainability: Frequently changing plugin API without versioning increases breakage.
340. Observability: No instructions for capturing client-side logs securely for support.
341. Performance: Serving large map tiles without progressive loading.
342. Reliability: Lacking fallback when persisted configuration is corrupted.
343. Security: No clear cookie handling guidance for auth tokens.
344. Maintainability: No examples of how to stub external dependencies in unit tests.
345. Accessibility: No guidelines for accessible form validations and error messages.
346. Performance: Inefficient DOM updates when updating many child nodes.
347. Developer UX: No local script to reset dev DB or seed demo content.
348. Security: No documented secure headers for the development server.
349. Maintainability: Insufficient separation between UI and data fetching concerns.
350. Observability: No simple local script for collecting app logs during a bug report.
351. Performance: Not using `prefers-reduced-motion` media query to disable heavy animations.
352. Reliability: No automatic recovery from transient storage errors.
353. Security: No guidance for encrypting sensitive local data before persistence.
354. Maintainability: No clear rules for adding large binary assets (where to place them).
355. Accessibility: No instructions for accessible keyboard shortcuts discovery.
356. Performance: Not batching DOM writes via `requestAnimationFrame` when performing many updates.
357. Developer UX: No ergonomic aliases for long script commands.
358. Security: No automated tests around file parsers to prevent injection attacks.
359. Maintainability: No continuous documentation build to ensure docs stay in sync.
360. Observability: No built-in client-side metric for load or TTI captured.
361. Performance: Large initial JS execution cost from heavy module initialization.
362. Reliability: No feature flag rollback procedure in case of regressions.
363. Security: No dependencies pinned to exact versions for reproducibility of audits.
364. Maintainability: No canonical examples of how to refactor large components.
365. Accessibility: No accessible error dialogs for failed imports or network errors.
366. Performance: Long-lived timers or intervals that are not tied to component lifecycle.
367. Developer UX: No `CONTRIBUTING.md` with PR/workflow expectations.
368. Security: No guidance for preventing open-source license conflicts when adding deps.
369. Maintainability: No enforcement of smaller file sizes or decomposition of giant files.
370. Observability: No alert thresholds configured for error rate increase.
371. Performance: Not using hardware-accelerated CSS transforms for animations.
372. Reliability: No per-feature rollout or gradual release mechanism described.
373. Security: No dependency policy for third-party imports in plugins.
374. Maintainability: No examples of writing migration scripts for persisted data.
375. Accessibility: Lack of clear focus order in complex panels and dialogs.
376. Performance: Unnecessary synchronous blocking during data initialization.
377. Developer UX: No example of how to run a single test or debug it interactively.
378. Security: No guidelines for validating and sanitizing user-submitted metadata.
379. Maintainability: No standard logging format to make parsing logs easier.
380. Observability: No approach for measuring feature-level adoption and failures.
381. Performance: Not deferring heavy DOM updates until after the first paint.
382. Reliability: No standard process for handling user-reported incidents in `incidents/`.
383. Security: No explicit documentation for secure deployment steps.
384. Maintainability: No examples of clear API contracts for plugin authors.
385. Accessibility: Several clickable non-semantic elements lack keyboard equivalents.
386. Performance: Frequent creation of new function instances passed as props.
387. Developer UX: No preconfigured debug launch configurations in VS Code for common tasks.
388. Security: No guidance for sanitizing query params used to build dynamic URLs.
389. Maintainability: No automatic dependency update testing to catch breaking changes.
390. Observability: No cohesive plan to capture UX metrics (time to interact, first meaningful paint).
391. Performance: No splitting of worker-heavy tasks into web workers.
392. Reliability: No replayability guide for reproducing intermittent issues locally.
393. Security: No documented process for responding to disclosed security vulnerabilities.
394. Maintainability: No examples of writing smaller, pure utility modules for reuse.
395. Accessibility: No support for RTL locales or layout mirroring in the UI.
396. Performance: Not using `IntersectionObserver` for lazy loading off-screen content.
397. Developer UX: No examples for debugging memory leaks in development mode.
398. Security: Not validating content-types strictly when accepting uploads.
399. Maintainability: No rule for keeping tests co-located with code to improve coverage.
400. Observability: No synthetic end-user monitors to detect regressions after deploys.
401. Performance: Not using content hashing to long-term cache static assets effectively.
402. Reliability: Not verifying integrity of persisted user preferences after upgrades.
403. Security: No hardening recommendations for Node-based utilities living in `_archive`.
404. Maintainability: No shared style tokens to enforce consistent UI styles across plugins.
405. Accessibility: Lack of ARIA descriptions for complex controls and ranges.
406. Performance: Heavy CPU work performed on main thread rather than offloaded.
407. Developer UX: No clear rollback steps documented for bad deployments.
408. Security: No role-based access guidance for administrative features in `_archive`.
409. Maintainability: No automated broken-link checks for docs and README.
410. Observability: No guidance for correlating client and server logs for a user session.
411. Performance: Excessive synchronous layout reads/writes in animation code.
412. Reliability: No tests to confirm app continues to function with partial network failure.
413. Security: No sample secure header configurations for production web server.
414. Maintainability: No automated tooling to find dead/unused files in the repo.
415. Accessibility: No visible method to enlarge UI controls for low-vision users.
416. Performance: Frequent forced reflows due to reading layout properties after writes.
417. Developer UX: No recipe for quickly reproducing production bugs locally.
418. Security: No privacy policy or handling notes for telemetry stored by the app.
419. Maintainability: No documented path for archiving or removing deprecated plugins.
420. Observability: No example of a rollout/rollback telemetry report for releases.
421. Performance: Blocking synchronous parsing of large datasets during startup.
422. Reliability: No automated snapshot backups for critical persisted data.
423. Security: No access control guidance for debug endpoints in development builds.
424. Maintainability: No clear guidelines for package version bumping and release notes.
425. Accessibility: Lack of content structure semantics (headings, landmarks) in templates.
426. Performance: Repetitive expensive calculations on each input change without debounce.
427. Developer UX: No documented local environment setup differences for Windows vs Unix.
428. Security: No guidance for rate-limiting UI endpoints used by plugins.
429. Maintainability: No consistent approach to error message localization.
430. Observability: No example of how to instrument user journeys for performance analysis.
431. Performance: Not leveraging streaming parsing for large JSON payloads.
432. Reliability: No mitigation for excessive persisted state growth over time.
433. Security: No standard process for reporting security issues to maintainers.
434. Maintainability: No examples of API contracts published for plugin authors.
435. Accessibility: No clear documentation on accessible toast notifications.
436. Performance: Repeating expensive library initializations across mounts.
437. Developer UX: No simple script to run a headless build to test production build speed.
438. Security: No documented secure defaults for third-party widget configuration.
439. Maintainability: No automated merge checks to prevent large, risky PRs.
440. Observability: No sampled session traces to detect performance regressions.
441. Performance: Not using modern image formats (WebP/AVIF) for large imagery.
442. Reliability: No monitoring alerts for client-side OOM or memory spikes.
443. Security: No content validation examples for rich text/markdown submissions.
444. Maintainability: No examples of plugin lifecycle hooks and expectations.
445. Accessibility: Lack of accessible labels for form controls across settings panes.
446. Performance: Unbounded growth of event listeners on navigation transitions.
447. Developer UX: No guidelines on branching strategy and PR size limits.
448. Security: No mention of how to handle user credentials securely in examples.
449. Maintainability: No mechanism to enforce minimal public API surfaces for modules.
450. Observability: No routine that emails or notifies maintainers on critical failures.
451. Performance: Large number of small assets causing many network handshakes.
452. Reliability: No test harness for simulating low-memory or CPU-limited environments.
453. Security: No content sanitization for third-party plugin outputs.
454. Maintainability: No tooling to visualize hot code paths for refactoring.
455. Accessibility: UI density may make it hard to select small controls on touch devices.
456. Performance: Not using `service-worker` caching for repeated tile fetches.
457. Developer UX: No suggested `node` and `npm` versions to use for development.
458. Security: No policy for whitelisting external media domains used in the app.
459. Maintainability: No automated script to sync shared types between packages.
460. Observability: No in-app way to surface error logs for power users to copy.
461. Performance: Heavy use of synchronous native APIs should be avoided.
462. Reliability: No automatic fallback strategy for failed background syncs.
463. Security: No clear process for reporting security issues to maintainers.
464. Maintainability: No example of continuous documentation deployment or preview.
465. Accessibility: No set of recommended accessibility testing scripts included in repo.
466. Performance: Frequent layout reflows due to reading layout properties in JS on each frame.
467. Developer UX: No example for debugging WebGL/Cesium context issues locally.
468. Security: No OAuth/credential rotation guidance if integrations exist.
469. Maintainability: Frequently changing plugin API without versioning increases breakage.
470. Observability: No instructions for capturing client-side logs securely for support.
471. Performance: Serving large map tiles without progressive loading.
472. Reliability: Lacking fallback when persisted configuration is corrupted.
473. Security: No clear cookie handling guidance for auth tokens.
474. Maintainability: No examples of how to stub external dependencies in unit tests.
475. Accessibility: No guidelines for accessible form validations and error messages.
476. Performance: Inefficient DOM updates when updating many child nodes.
477. Developer UX: No local script to reset dev DB or seed demo content.
478. Security: No documented secure headers for the development server.
479. Maintainability: Insufficient separation between UI and data fetching concerns.
480. Observability: No simple local script for collecting app logs during a bug report.
481. Performance: Not using `prefers-reduced-motion` media query to disable heavy animations.
482. Reliability: No automatic recovery from transient storage errors.
483. Security: No guidance for encrypting sensitive local data before persistence.
484. Maintainability: No clear rules for adding large binary assets (where to place them).
485. Accessibility: No instructions for accessible keyboard shortcuts discovery.
486. Performance: Not batching DOM writes via `requestAnimationFrame` when performing many updates.
487. Developer UX: No ergonomic aliases for long script commands.
488. Security: No automated tests around file parsers to prevent injection attacks.
489. Maintainability: No continuous documentation build to ensure docs stay in sync.
490. Observability: No built-in client-side metric for load or TTI captured.
491. Performance: Large initial JS execution cost from heavy module initialization.
492. Reliability: No feature flag rollback procedure in case of regressions.
493. Security: No dependencies pinned to exact versions for reproducibility of audits.
494. Maintainability: No canonical examples of how to refactor large components.
495. Accessibility: No accessible error dialogs for failed imports or network errors.
496. Performance: Long-lived timers or intervals that are not tied to component lifecycle.
497. Developer UX: No `CONTRIBUTING.md` with PR/workflow expectations.
498. Security: No guidance for preventing open-source license conflicts when adding deps.
499. Maintainability: No enforcement of smaller file sizes or decomposition of giant files.
500. Observability: No alert thresholds configured for error rate increase.

Human-user perspective (501–1000)

501. Onboarding: No guided first-run experience to help new users discover features.
502. Discoverability: Many features (plugins/panels) are hidden behind icons with unclear affordance.
503. Cognitive load: Dense UI with many simultaneous visual elements overwhelms new users.
504. Accessibility: Custom cursors and particle effects can be disorienting for neurodiverse users.
505. Mobile usability: Heavy visualizations are not optimized for small screens or low-power devices.
506. Performance: Slow initial load creates poor first impressions for human users.
507. Consistency: Inconsistent iconography and labels across settings panes confuse users.
508. Help: No in-app contextual help or tooltips explaining complex controls.
509. Localization: Hard-coded English UI text prevents non-English users from using the app.
510. Error messages: Technical errors shown verbatim instead of friendly, actionable messages.
511. Privacy: No clear privacy notice about what telemetry (if any) is collected.
512. Accessibility: No keyboard-only navigation path for core workflows (chat, imagery controls).
513. Responsiveness: UI layout can overflow or overlap on narrow windows.
514. Learnability: Complex panels lack examples or quick presets for common tasks.
515. Visual noise: Particle overlays and animated cursors distract from core content.
516. Trust: No clear indication of data provenance for satellite and imagery sources.
517. Control: No easy toggle to disable heavy animations for accessibility or performance.
518. Error recovery: When something fails, users are not guided on how to fix it.
519. Feedback: No progress indicators for long-running operations like imports or syncs.
520. Consistency: Settings are spread across multiple panes without a central search.
521. Discoverability: Key features are buried in nested menus rather than surfaced.
522. Aesthetics: Color themes may not adapt to user preferences (dark/light mismatch).
523. Accessibility: No support for screen magnifier users to adjust text size.
524. Performance: Unresponsive UI during heavy background computations frustrates users.
525. Onboarding: No sample data or tour to let users try features immediately.
526. Clarity: Some icons lack labels, forcing users to guess their function.
527. Accessibility: No alternative text for images/tiles limiting comprehension for blind users.
528. Usability: Small hit targets make tapping controls on mobile difficult.
529. Privacy: No obvious way for users to clear their persisted local data or history.
530. Trust: No version indicator visible to end users to validate deployments.
531. Accessibility: Color-only indicators (e.g., status) are not usable by colorblind users.
532. Help: No searchable help center or contextual documentation integrated in-app.
533. Accessibility: Lack of captions or transcripts for audio feedback used in the app.
534. UX: Too many simultaneous notifications can overwhelm users without rate-limiting.
535. Onboarding: No teacher-specific presets making it harder to use in classrooms.
536. Localization: Date/time and number formats may not respect user locale.
537. Performance: High CPU usage drains battery on laptops and tablets during sessions.
538. Accessibility: No clear keyboard shortcuts discovery modal or help page.
539. Predictability: Some interactive behaviors (drag/drop) have inconsistent affordances.
540. Accessibility: No guidance for screen-reader users on how to navigate interactive globe elements.
541. Personalization: Theme options are limited, preventing users from tailoring readability.
542. Clarity: Technical labels are exposed to end users without translation or simplification.
543. Security: No visible account or session management features for end users.
544. Accessibility: No easy way to pause or disable animations for photosensitive users.
545. Usability: Import failures lack clear explanations and steps to retry.
546. Learnability: Complex plugin interactions lack examples or recipes for common workflows.
547. Accessibility: Focus order in panels is not intuitive for keyboard users.
548. Feedback: Copy/paste and clipboard operations lack consistent success feedback.
549. Privacy: No explicit consent flow shown when collecting any usage data.
550. Accessibility: Not all interactive elements are reachable with assistive tech.
551. UX: Overloaded toolbars with many icons create decision fatigue.
552. Clarity: No in-app changelog for users to learn what changed between versions.
553. Accessibility: Small text in dense panels is hard to read on low-resolution monitors.
554. Usability: Frequent modal dialogs interrupt workflows without autosave.
555. Personalization: No saved workspace layouts so users must reconfigure each session.
556. Onboarding: No teacher-specific templates making it harder to use in classrooms.
557. Accessibility: Lack of alternative UI modes for accessibility demos or training.
558. Feedback: Long operations (e.g., build or import) do not show ETA or percent complete.
559. Consistency: Conflicting settings across panes cause user confusion about which value applies.
560. Accessibility: Some interactive widgets lack aria-labels for screen readers.
561. UX: Inadequate spacing and padding make scanning content difficult.
562. Performance: Sudden freezes during heavy operations degrade perceived reliability.
563. Clarity: Technical error dumps shown to users instead of sanitized, helpful messages.
564. Accessibility: No mechanism for voice-control or hands-free interactions.
565. Usability: Settings are too granular without higher-level toggles for common scenarios.
566. Personalization: No ability to save presets for commonly used configurations.
567. Onboarding: No sample tutorials or guided exercises for educators to use the app.
568. Accessibility: No support for large cursors or pointer customization for motor-impaired users.
569. Trust: No information about data retention policies for uploaded files.
570. Feedback: Silent failures (no visible error) lead to user confusion and repeated actions.
571. Accessibility: No screen-reader friendly labels for dynamic graphs or charts.
572. Usability: Drag-and-drop areas lack clear drop-target feedback.
573. Clarity: Unclear iconography leads to accidental actions (e.g., delete vs hide).
574. Accessibility: No alternative keyboard-only flows for gesture-based interactions.
575. UX: Over-reliance on hover-only interactions which are not available on touch devices.
576. Learnability: No guided templates to quickly create common map views.
577. Localization: No translations for plugin metadata and names.
578. Accessibility: Insufficient contrast between text and background in some themes.
579. Usability: Some controls require too many steps for simple tasks.
580. Feedback: Users are not informed when background syncing completes successfully.
581. Accessibility: No way to increase hit target sizes globally for touch devices.
582. Clarity: Some labels use acronyms without tooltips explaining them.
583. Accessibility: No way to simulate low-vision or screen-reader views from within the app.
584. Feedback: No easy way to reproduce or share the exact app state with support.
585. Personalization: No default presets optimized for performance on low-end devices.
586. Onboarding: No educator-mode that explains pedagogical use-cases.
587. Accessibility: No touch-optimized controls for interactive sliders and knobs.
588. Trust: No verification of plugin authors or their safety reputation.
589. Usability: No bulk actions for managing many layers or items at once.
590. Accessibility: No dynamic aria-live regions to announce updates from background tasks.
591. UX: Inconsistent placement of common controls across different panels.
592. Clarity: Some settings use jargon unfamiliar to non-technical users.
593. Accessibility: No text-scaling control across entire app without breaking layout.
594. Feedback: No guidance on how to escalate urgent production-impacting issues.
595. Personalization: No recommended presets based on device capabilities.
596. Onboarding: No role-based walkthroughs tailored for teachers vs students.
597. Accessibility: No prebuilt accessible themes targeted at common diagnoses.
598. Trust: No process to verify plugin compatibility with the current app version.
599. Usability: Search results are not persisted or bookmarkable for later review.
600. Accessibility: No keyboard accessible tour modal for first-time users.
601. Clarity: Advanced settings are not clearly separated from beginner settings.
602. Accessibility: No option to reduce motion or disable auto-playing content.
603. Feedback: No aggregated usage tips based on common user behaviors.
604. Personalization: No way to pin frequently used panels or tools.
605. Onboarding: No video walkthroughs or quick-start guides for new users.
606. Accessibility: No touch-friendly adjustments for interactive sliders and knobs.
607. Trust: No public roadmap or future feature timeline visible in-app.
608. Usability: No ability to export user settings or share workspace configurations.
609. Accessibility: Lack of accessible alternatives for content-heavy visuals.
610. Clarity: No clear indicator of which data layer is active or selected.
611. Accessibility: Tooltips often disappear too quickly for assistive technology users.
612. Feedback: No persistent notification center to revisit missed alerts.
613. Personalization: No per-project default settings that persist across devices.
614. Onboarding: No teacher-specific help or lesson templates shipped with the app.
615. Accessibility: No instructions or examples for making user-created content accessible.
616. Trust: No visible compliance with common data protection frameworks.
617. Usability: No simple compare mode to inspect changes across versions.
618. Accessibility: No keyboard-only annotation tools for marking maps.
619. Clarity: Some complex features lack concise one-line descriptions.
620. Accessibility: No large-font or high-contrast presentation mode for exported reports.
621. Feedback: No explicit confirmation modal for destructive batch operations.
622. Personalization: No one-click reset to default layout for users who mess up their workspace.
623. Onboarding: No recommended classroom hardware specifications in docs.
624. Accessibility: No readily available scripts for screen-reader testing of common flows.
625. Trust: No documentation on trusted contributors or maintainer contact info.
626. Usability: No drag-handle affordances for rearranging complex panel layouts.
627. Accessibility: No persistent keyboard help overlay available throughout the app.
628. Clarity: Error dialogs often show stack traces or raw errors with no actionable guidance.
629. Accessibility: No built-in magnifier or simplified view for low-vision users.
630. Feedback: No mechanism to report missing or inaccurate data sources from within the UI.
631. Personalization: No ability to lock or save panel layouts per user.
632. Onboarding: No built-in exercises demonstrating classroom-scale scenarios.
633. Accessibility: No clear way to label dynamically added interactive elements for assistive tech.
634. Trust: No clear statement about how long uploaded files are retained.
635. Usability: Too many modal confirmations disrupt workflow compared to inline actions.
636. Accessibility: No way to toggle narration or descriptive audio for complex visuals.
637. Clarity: Some features lack a simple "what does this do" short description.
638. Accessibility: No mechanism to pause automatic updates that disrupt reading.
639. Feedback: No end-user documentation on how to interpret technical log dumps.
640. Personalization: No ability to set a minimal UI for novice users.
641. Onboarding: No testimonials or sample lesson plans tailored to different curricula.
642. Accessibility: No method to validate exports for accessibility compliance before distribution.
643. Trust: No published security audits or penetration test reports.
644. Usability: No mode to present content full-screen for classroom displays.
645. Accessibility: No consistent visual focus indications on interactive controls.
646. Clarity: Some advanced settings use developer jargon instead of plain language.
647. Accessibility: No in-app validation to ensure color combinations meet WCAG AA.
648. Feedback: No easy way to contact maintainers with attachments or logs for bug reports.
649. Personalization: No per-user shortcuts or macros to speed repetitive tasks.
650. Onboarding: No community sample projects demonstrating pedagogical examples.
651. Accessibility: No keyboard-accessible editor for annotating media.
652. Trust: No visible license summary explaining reuse or redistribution terms.
653. Usability: Export interfaces lack consistent default formats for end users.
654. Accessibility: No instructions for attaching textual descriptions to images at import time.
655. Clarity: No user-friendly explanations when a plugin is incompatible with current version.
656. Accessibility: No automated checks to flag inaccessible color combinations during authoring.
657. Feedback: No in-app prompts to suggest feature usage tips after repeated behaviors.
658. Personalization: No automatic performance mode toggles based on device specs.
659. Onboarding: No quick "Try this" button to generate demo content for exploration.
660. Accessibility: No clear method to provide alternate text for complex visualizations.
661. Trust: No public contributor list or governance model for community plugins.
662. Usability: No facility to group layers into folders or logical collections.
663. Accessibility: No separate accessible reports generated during heavy exports.
664. Clarity: No in-context examples of common data formatting pitfalls for imports.
665. Accessibility: No option to replace animated transitions with simple fades for accessibility.
666. Feedback: No way for users to mark or bookmark helpful docs for later reference.
667. Personalization: No saved views or bookmarks shared across teammates.
668. Onboarding: No suggested curriculum or learning outcomes matched to features.
669. Accessibility: No indication whether UI element is operable by keyboard.
670. Trust: No public security or privacy contact for reporting incidents.
671. Usability: No sample presets for common classroom display resolutions.
672. Accessibility: No method to export screen-reader friendly summaries of content.
673. Clarity: No explanation of how to interpret unfamiliar terms in data layers.
674. Accessibility: No way to produce simplified printable handouts from complex views.
675. Feedback: No contextual hints guiding users to next likely actions after import.
676. Personalization: No user-level quick settings applied across all projects.
677. Onboarding: No pre-configured teacher accounts with sample data to replicate lessons.
678. Accessibility: No keyboard-first alternatives for gesture-based drawing tools.
679. Trust: No public logs or disclosures about historical data breaches or incidents.
680. Usability: No consistent placement for search and filter controls across panels.
681. Accessibility: No guidance for creating accessible slide-export of map views.
682. Clarity: No in-place validation while editing complex mapping parameters.
683. Accessibility: No built-in resize handles large enough for touch users.
684. Feedback: No status indicator when app is syncing in background.
685. Personalization: No user-level templates for visual themes shared across projects.
686. Onboarding: No curated "teacher packs" with step-by-step lesson guides.
687. Accessibility: No tooltips that remain visible and accessible to screen readers.
688. Trust: No mention of data retention and deletion policies in user settings.
689. Usability: No quick copyable link to share current view with others.
690. Accessibility: No assistive mode that provides slow-paced step-by-step directions.
691. Clarity: No default presets for different user expertise levels (novice/expert).
692. Accessibility: No dedicated low-vision theme shipped out-of-the-box.
693. Feedback: No mechanism to attach logs or screenshots to bug reports automatically.
694. Personalization: No per-user shortcuts for frequently used actions.
695. Onboarding: No teacher-focused onboarding flow or checklist included.
696. Accessibility: No consistent pattern to ensure focus is visible on all interactive elements.
697. Trust: No published process for evaluating plugin safety and privacy.
698. Usability: No quick keyboard navigation between main panels and controls.
699. Accessibility: No way to increase global font scaling without breaking layout.
700. Clarity: Lack of a centralized glossary for domain-specific terms used in the UI.
701. Accessibility: No consistent guidance on how to add accessible alternatives when importing media.
702. Trust: No transparency about telemetry collection or purpose shown in-app.
703. Usability: No easy import preview to confirm mapping before completion.
704. Accessibility: No way to test keyboard navigation across complex map widgets.
705. Clarity: No simple descriptions for advanced toggles and their potential side effects.
706. Accessibility: No method to reduce the cognitive complexity of multi-step tools for neurodiverse users.
707. Feedback: No user-facing status page indicating ongoing incidents or maintenance.
708. Personalization: No quick UI modes tailored to beginner, intermediate, or advanced users.
709. Onboarding: No teacher example workflows that demonstrate real classroom use.
710. Accessibility: No accessible export profiles that produce tagged outputs for assistive tech.
711. Trust: No trust indicators or verified plugin badges in the plugin UI.
712. Usability: No global preview mode to test how shared artifacts will appear to other users.
713. Accessibility: No step-by-step accessible tutorials for the main workflows.
714. Clarity: No visual cues to explain complex toggle dependencies between settings.
715. Accessibility: No consistent audible feedback patterns for important UI events.
716. Feedback: No detailed error classification available to end users for triage.
717. Personalization: No default configurations per role that tailor the UI to responsibilities.
718. Onboarding: No curated example datasets grouped by subject or age group.
719. Accessibility: No instructions on how to localize the UI for assistive tech users.
720. Trust: No external audits visible verifying plugin authors or data sources.
721. Usability: No quick access to frequently used tools at the center of the screen.
722. Accessibility: No demonstration projects showing best practices for accessible content.
723. Clarity: No in-app indication when a plugin is experimental or stable.
724. Accessibility: No consistent method for providing alt text during bulk imports.
725. Feedback: No in-app feedback summary collected periodically to show improvements.
726. Personalization: No profile-level settings to disable advanced features permanently.
727. Onboarding: No role-based quick start that demonstrates the student's perspective.
728. Accessibility: No globally available keyboard shortcut to toggle high-contrast mode.
729. Trust: No regular security or privacy readiness statements for public consumption.
730. Usability: No simple mechanism for collaborative editing or sharing ephemeral sessions.
731. Accessibility: No test harness for verifying that exported reports retain accessibility metadata.
732. Clarity: No straightforward way to discover dataset metadata or source licensing.
733. Accessibility: No guidance on how to author accessible annotations for maps and images.
734. Feedback: No aggregated feedback loop that surfaces common usability complaints.
735. Personalization: No quick-help button that adjusts help content to user level.
736. Onboarding: No recommended classroom activities that utilize core features.
737. Accessibility: No mapping of keyboard-only sequences for complex interactions.
738. Trust: No verified badge for community contributors that meet code-quality standards.
739. Usability: No safe preview mode before applying destructive bulk operations.
740. Accessibility: No clear labeling of dynamic data updates for screen-reader users.
741. Clarity: No visible method for showing plugin compatibility checks for a given app version.
742. Accessibility: No best-practice templates for accessible visualizations shipped with the app.
743. Feedback: No feature to nominate helpful tutorials or content for other users.
744. Personalization: No per-user feature flags to turn off experimental UI pieces permanently.
745. Onboarding: No in-app course module examples for classroom rollouts.
746. Accessibility: No visual contrast audit built into settings for authors.
747. Trust: No public disclosure of third-party data sources and their licenses.
748. Usability: No method to bulk-assign metadata fields during imports.
749. Accessibility: No method to automatically generate alt text from image metadata.
750. Clarity: No standardized tooltip timing and persistence across the UI.
751. Accessibility: No documented method to link UI elements to accessible help content.
752. Feedback: No easy channel to request priority support for classroom incidents.
753. Personalization: No per-user defaults for the main layout and toolset.
754. Onboarding: No recommended practice for instructors to partition student workspaces.
755. Accessibility: No explicit keyboard-first alternatives for gesture-heavy controls.
756. Trust: No published list of security mitigations in place for production deployments.
757. Usability: No persistent breadcrumb trail to track navigation within complex tools.
758. Accessibility: No guidance for creating accessible labels for dynamically generated controls.
759. Clarity: No standard labeling convention for plugin categories and tags.
760. Accessibility: No instructions for verifying accessible exported documents in common tools.
761. Feedback: No mechanism to request classroom feature enhancements directly from the app.
762. Personalization: No ability to prioritize tool order in the main toolbar.
763. Onboarding: No simple sharing templates for distributing lesson assets to students.
764. Accessibility: No automated suggestion for improving color contrast where failing.
765. Trust: No explicit privacy safeguards for student data highlighted for educators.
766. Usability: No built-in diff or history view for tracking changes to content.
767. Accessibility: No consistent method for labeling custom icons with readable text.
768. Clarity: No conventional place to find official plugin compatibility matrices.
769. Accessibility: No automatic checks for voice-over compatibility in sample workflows.
770. Feedback: No aggregated changelog for non-technical users showing feature highlights.
771. Personalization: No quick toggles for presentation vs editing modes.
772. Onboarding: No minimal demo that runs entirely offline for classroom use.
773. Accessibility: No method to ensure exported materials are accessible to people with disabilities.
774. Trust: No public record of past security incident resolutions and learnings.
775. Usability: No quick keyboard shortcuts for power-user workflows documented.
776. Accessibility: No way to disable complex animations from within app settings.
777. Clarity: No inline help for common mapping coordinate formats and conversions.
778. Accessibility: No explicit visual indicators that an area is keyboard focusable.
779. Feedback: No explicit mechanism to flag outdated or wrong documentation.
780. Personalization: No per-user dashboard summarizing recent activity and shortcuts.
781. Onboarding: No clear teacher-admin instructions for multi-user classroom management.
782. Accessibility: No alternative text generation assistant bundled to help with alt text.
783. Trust: No published third-party audits or attestations about platform security.
784. Usability: No quick toggle to center map or restore default camera position.
785. Accessibility: No accessible annotations panel listing textual summaries for visuals.
786. Clarity: No default example searches to help users get started.
787. Accessibility: No fallback accessible color palette indicated in settings.
788. Feedback: No facility to preview how content appears on different devices.
789. Personalization: No per-user keyboard preferences saving and synchronization.
790. Onboarding: No curated playlist of short how-to videos embedded in the launcher.
791. Accessibility: No explicit mode to run the app with simplified navigation for novices.
792. Trust: No published maintenance window schedule or support SLAs for hosted offerings.
793. Usability: No ability to partially save or checkpoint long editing sessions.
794. Accessibility: No easy way to export data with semantic labels and descriptions.
795. Clarity: No visible source-of-truth metadata for derived data layers.
796. Accessibility: No built-in training or guidance for accessible classroom content.
797. Feedback: No aggregated suggestions based on frequent user errors to help fix UX issues.
798. Personalization: No per-user quick-access control to toggle panels on/off quickly.
799. Onboarding: No role-based starter kits for educators, researchers, or students.
800. Accessibility: No method to verify color contrast for dynamic content generated by users.
801. Trust: No clear contact information for legal or privacy inquiries.
802. Usability: No export options optimized for simple print handouts for classrooms.
803. Accessibility: No clear sequence for keyboard navigation in multi-column layouts.
804. Clarity: No inline examples of valid input when configuring advanced options.
805. Accessibility: No straightforward option to enable large cursors or pointer aids.
806. Feedback: No built-in bug reporting that includes environment details automatically.
807. Personalization: No ability to switch between simplified and advanced toolbars per user.
808. Onboarding: No obvious path to import classroom rosters or student lists.
809. Accessibility: No tool to validate accessibility in the exported formats used by teachers.
810. Trust: No public list of third-party services used and their roles in the app.
811. Usability: No simple 'preview' for how an activity will appear to a student vs teacher.
812. Accessibility: No mention of tab order expectations for dynamic UIs in the docs.
813. Clarity: Some workflows do not provide reversible steps which is confusing to users.
814. Accessibility: No accent or dyslexia-friendly font options supplied out-of-the-box.
815. Feedback: No in-app method to request help with a specific dataset or plugin.
816. Personalization: No per-user theme or color selection saved across sessions.
817. Onboarding: No teacher-facing checklists for deploying an activity to a class.
818. Accessibility: No accessible export templates that preserve semantic markup.
819. Trust: No explicit statement about how user data is shared or retained with third parties.
820. Usability: No search highlighting to show where query terms matched in results.
821. Accessibility: No standard approach to labeling control groups for assistive tech.
822. Clarity: No in-app glossary that explains domain terms and acronyms.
823. Accessibility: No guidance for ensuring keyboard controls are labeled for screen readers.
824. Feedback: No automated advice to help users fix common import mapping errors.
825. Personalization: No built-in UI presets targeted at different age groups or classes.
826. Onboarding: No readily available sample lesson that integrates mapping, chat, and content.
827. Accessibility: No mechanisms to ensure exported PDFs maintain accessible tags.
828. Trust: No published timeline for security patch rollouts or vulnerability fixes.
829. Usability: No rapid undo/redo stack shown prominently for quick corrections.
830. Accessibility: No simple path to convert rich visualizations into textual summaries.
831. Clarity: No obvious way to identify which plugin owns which UI elements.
832. Accessibility: No guidance on ensuring that custom iconography includes clear labels.
833. Feedback: No in-app walk-throughs tailored to different user roles (teacher/student).
834. Personalization: No shared workspace templates to quickly set up a collaborative environment.
835. Onboarding: No example classroom assignments that showcase best practices.
836. Accessibility: No recommended color palettes for common types of visualizations.
837. Trust: No public changelog highlighting security-related fixes.
838. Usability: No option to lock certain panels to prevent accidental movement.
839. Accessibility: No support for braille devices or export formats compatible with them.
840. Clarity: No consistent documentation link visible from within the app for every panel.
841. Accessibility: No automated checks for ARIA attributes in dynamic content.
842. Feedback: No fine-grained telemetry opt-out for privacy-conscious institutions.
843. Personalization: No global save for favorite tools and layout across projects.
844. Onboarding: No classroom-ready examples demonstrating student workflows.
845. Accessibility: No indicators for whether interactive content is accessible before publishing.
846. Trust: No explicit policy or method for removing sensitive content upon request.
847. Usability: No helpers to resolve conflicts when multiple users edit shared content.
848. Accessibility: No suggested best practices for authoring accessible lesson materials.
849. Clarity: No in-app pointer explaining which plugin is active during mixed-plugin workflows.
850. Accessibility: No simple export to accessible HTML or tagged PDF for distribution.
851. Feedback: No in-app analytics showing which features are most used to guide improvements.
852. Personalization: No per-user quick access to commonly used maps or datasets.
853. Onboarding: No short interactive exercises that teach core interactions.
854. Accessibility: No keyboard mapping suggestions for complex interaction gestures.
855. Trust: No public statement describing what data is collected and why.
856. Usability: No method to create and share tutorials with embedded steps and screenshots.
857. Accessibility: No easy method to attach descriptions to images during import.
858. Clarity: No unified index of all plugin features and their documentation links.
859. Accessibility: No built-in checks to ensure color contrast across themes.
860. Feedback: No ability to pin important messages or warnings for later review.
861. Personalization: No per-user workspace backup and restore functionality.
862. Onboarding: No recommended starter sets of plugins for classroom usage.
863. Accessibility: No way to test app behavior with screen magnifiers built into the UI.
864. Trust: No public incident disclosure policy or contact for security issues.
865. Usability: No way to preview how content will look on different screen sizes.
866. Accessibility: No method to easily add ARIA labels to complex custom widgets.
867. Clarity: Some advanced options lack confirm dialogs making accidental changes easy.
868. Accessibility: No cross-device accessible export testing tools provided.
869. Feedback: No in-app mechanism to crowdsource translations or localization suggestions.
870. Personalization: No per-user saved presets for frequently used search filters.
871. Onboarding: No pre-configured classroom demo accounts to show instructor flows.
872. Accessibility: No default accessible color themes shipped with the app.
873. Trust: No documentation about data residency options for different jurisdictions.
874. Usability: No automatic suggestions when import mapping fails to match fields.
875. Accessibility: No built-in testing harness to validate keyboard-only flows.
876. Clarity: Complex visualizations lack accessible textual summaries by default.
877. Accessibility: No guidance for authoring content with screen-reader friendly descriptions.
878. Feedback: No in-app suggestion box to propose new features or report docs errors.
879. Personalization: No way to set up a classroom workflow that limits what students can edit.
880. Onboarding: No curated playlists of short tutorials for common teacher tasks.
881. Accessibility: No method to export simplified printable versions of complex views.
882. Trust: No public schedule for routine maintenance or updates.
883. Usability: No multi-tab sync or cross-device continuity features to continue work.
884. Accessibility: No in-app tool to generate alt text suggestions for images.
885. Clarity: No clear distinction between draft and published datasets in UI.
886. Accessibility: No recommended approach to make animated visuals accessible during presentations.
887. Feedback: No way to assign priority to reported bugs within the app reporting system.
888. Personalization: No team-level presets for shared workspace layouts.
889. Onboarding: No quick link to community-contributed lesson examples and templates.
890. Accessibility: No built-in accessible templates for slide exports.
891. Trust: No manifest of third-party integrations and vendor contacts.
892. Usability: No bulk metadata editors for cleaning up many imported items.
893. Accessibility: No accessible preview tools for export formats used by teachers.
894. Clarity: No developer/teacher mapping explaining how features support curriculum outcomes.
895. Accessibility: No way to ensure exported files contain semantic markup for assistive tech.
896. Feedback: No integrated mechanism to vote on feature requests.
897. Personalization: No personalization for reading vs editing modes specialized for students.
898. Onboarding: No simple demonstration of how to collaborate in real-time with students.
899. Accessibility: No recommended patterns for accessible data visualizations in docs.
900. Trust: No public security maturity statements such as SOC or ISO certifications.
901. Usability: No consistent affordance for toggling layers visibility across panels.
902. Accessibility: No accessible forms for bulk import mapping corrections.
903. Clarity: No consistent naming patterns in UI leading to confusion across plugins.
904. Accessibility: No built-in keyboard command mapping helper for complex sequences.
905. Feedback: No mechanism to attach context (view/screenshot) when reporting a bug.
906. Personalization: No persistent account-level preferences for display or behavior.
907. Onboarding: No suggested classroom lesson plan templates to get started quickly.
908. Accessibility: No simple way to convert large multimedia content into accessible textual representations.
909. Trust: No public list of responsible disclosure contacts or policies.
910. Usability: No quick toggle to show/hide advanced controls for novice users.
911. Accessibility: No example accessible color palettes for common chart types.
912. Clarity: No inline migration notes when settings schema changes across versions.
913. Accessibility: No quick way to audit content accessibility before publishing a lesson.
914. Feedback: No per-feature quick feedback widget to submit targeted comments.
915. Personalization: No per-user saved UI density and font scaling settings.
916. Onboarding: No starter templates to demonstrate multi-step classroom activities.
917. Accessibility: No built-in methods for users to request accessible alternatives for content.
918. Trust: No published list of third-party data licenses and attribution requirements.
919. Usability: No easy way to clone or duplicate complex workspaces for reuse.
920. Accessibility: No mapping of UI elements to assistive technology-friendly labels.
921. Clarity: No explicit list of supported file formats and their limitations.
922. Accessibility: No method to map visual markers to textual descriptions for export.
923. Feedback: No built-in telemetry opt-in toggle presented to end users.
924. Personalization: No per-role default settings to streamline workflows for teachers.
925. Onboarding: No publicly available lesson templates to preview before importing.
926. Accessibility: No available ARIA patterns for custom widgets documented in the project.
927. Trust: No documentation about how backups and disaster recovery are handled.
928. Usability: No discoverable method to reveal keyboard-only commands across the app.
929. Accessibility: No default keyboard accelerators for navigating major panels.
930. Clarity: No mapping between domain-specific terms and student-friendly explanations.
931. Accessibility: No method to export plain-text summaries automatically alongside visual exports.
932. Feedback: No mechanism to subscribe to updates on feature requests or issues.
933. Personalization: No per-account preferred locale or language persistence.
934. Onboarding: No recommended classroom exercises that use combined plugin functionality.
935. Accessibility: No consistent labeling and relationship mapping for complex controls.
936. Trust: No published security or privacy compliance attachments for enterprise customers.
937. Usability: No quick keyboard shortcuts to move between major functional areas.
938. Accessibility: No simple accessible export formats for spreadsheets and presentations.
939. Clarity: No documentation on how to extend or customize the UI safely.
940. Accessibility: No explicit guidance on accessible chart color schemes.
941. Feedback: No simple way for users to suggest UI improvements inline.
942. Personalization: No ability to create and share preset tool palettes with teams.
943. Onboarding: No teacher-friendly quick start guide focused on one lesson example.
944. Accessibility: No built-in option to generate accessible transcripts for audio content.
945. Trust: No detailed privacy statements for shared or collaborative spaces.
946. Usability: No per-user quick toggles to disable heavy visuals during presentations.
947. Accessibility: No validation to ensure exported documents contain proper header structures.
948. Clarity: No short-form descriptions near complex controls to aid new users.
949. Accessibility: No consistent approach to ensure dynamic content is announced to screen readers.
950. Feedback: No prominent contact/support link in the UI for urgent help.
951. Personalization: No role-based default views to simplify the interface for various users.
952. Onboarding: No pre-built sample classroom activities or lesson templates.
953. Accessibility: No method to test assistive tech compatibility from within the app.
954. Trust: No public incident disclosure policy or timeline for reporting resolved issues.
955. Usability: No export presets optimized for print or handouts.
956. Accessibility: No built-in translator for alt text or labels to expedite localization.
957. Clarity: No direct link from complex controls to their relevant documentation pages.
958. Accessibility: No accessible equivalents for mouse-only gestures.
959. Feedback: No per-user preference to send anonymized usage data to aid improvements.
960. Personalization: No persistent quick-links to favorite datasets or views.
961. Onboarding: No sample classroom sequences demonstrating multiple app features working together.
962. Accessibility: No explicit policy for accessible content when creating lessons.
963. Trust: No published terms describing data ownership for user-uploaded content.
964. Usability: No simple mechanism for exporting a lesson package for offline use.
965. Accessibility: No checkbox to enable simplified UI optimized for assistive tech.
966. Clarity: Some actions lack confirmation and are irreversible without warnings.
967. Accessibility: No tools to assist in authoring accessible components for plugin authors.
968. Feedback: No community forum link or way to discuss feature ideas from the app.
969. Personalization: No saved user workspaces that follow a user across devices.
970. Onboarding: No sample student activities to demonstrate learning outcomes.
971. Accessibility: No recommended keyboard-first authoring patterns documented.
972. Trust: No published vendor list for external services used by the app.
973. Usability: No bulk export options that preserve accessibility metadata.
974. Accessibility: No automatic recommendations for making visuals more contrast-friendly.
975. Clarity: No easy-to-find list of supported data sources and connectors.
976. Accessibility: No test harness for keyboard-only navigation across all views.
977. Feedback: No easy path to propose translation improvements for UI strings.
978. Personalization: No default workspace templates for students vs teachers.
979. Onboarding: No curated example activities aligned to national curricula.
980. Accessibility: No suggested workflows for ensuring lesson exports are accessible.
981. Trust: No public changelog dedicated to security and privacy updates.
982. Usability: No quick navigation shortcuts to most-used features.
983. Accessibility: No method to ensure exported PDFs are tagged and accessible.
984. Clarity: No consistent policy describing how to update user-facing messages for changes.
985. Accessibility: No example accessible exports included in repository documentation.
986. Feedback: No on-boarding survey to capture first-run user needs.
987. Personalization: No per-user saved preference for locale and time formats.
988. Onboarding: No simple tutorial that demonstrates classroom collaboration features.
989. Accessibility: No automatic audit that flags missing aria attributes on dynamic content.
990. Trust: No public security assurance certificate or audit report.
991. Usability: No quick method to lock content for review or grading.
992. Accessibility: No consistent method to provide text alternatives to complex visuals.
993. Clarity: Error and status messages often use internal terminology unfamiliar to end users.
994. Accessibility: No per-plugin accessible checklists for third-party authors.
995. Feedback: No built-in way to gather user satisfaction ratings after key interactions.
996. Personalization: No per-user keyboard mapping or macro capabilities.
997. Onboarding: No example classroom workflows that can be imported directly.
998. Accessibility: No support for generating accessible transcripts from audio feedback.
999. Trust: No public statement about how user content is archived or backed up.
1000. Usability: Overabundance of advanced options without clear beginner vs advanced modes.

End of audit (1000 negatives). Use `docs/remediation-plan-top20.md` for prioritized fixes.
