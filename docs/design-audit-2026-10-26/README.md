# Silver Wolf VI: design audit and product research

**Date:** 2026-10-26
**Scope:** Silver Wolf VI local app, launcher, Chat, Space, Telescope, Settings, and a 390 × 844 mobile viewport. Audience: operators and contributors evaluating whether the workspace is understandable, trustworthy, and usable. Research horizon: current observed build, plus existing project evidence.
**Method:** Direct walkthrough in the Codex in-app Browser at `http://127.0.0.1:3005/`, fresh screenshots saved in `screenshots/`, DOM observations after actions, and console warning review. Public references are used only to ground best-practice recommendations; they are not evidence about Silver Wolf user frequency.

## Executive read

The workspace has a distinctive visual identity and its main Chat, Space, and Telescope surfaces are reachable. The strongest issue is trust: the local assistant replies with a diagnostic test string and exposes a developer-context heading in the conversation. The spatial experience looks operational, but transitions between modes can leave the globe at a scale and camera state that makes the Earth and labels difficult to interpret; Telescope remains at “Connecting” while feed actions are disabled. At 390 × 844, the floating mode control overlaps the Chat header and long assistant output runs behind the fixed composer. Settings offers theme selection twice and compresses many advanced controls into one long surface. These observations suggest the next design pass should focus on truthful, recoverable states and responsive layout before adding visual effects or more controls.

This is a one-session heuristic audit, not a user study: it identifies observed problems and testable hypotheses, but cannot establish how often they affect users or whether the behavior is consistent across normal devices and accounts.

## Walkthrough steps

| Step | Description | Health |
|---|---|---|
| 1 | Open launcher; inspect runtime and bridge status | Fair — clear system status, but “Launch Workspace” competes with diagnostics only mildly; bridge offline has no recovery action in this view. The launcher was inspected live; a local copy of its screenshot was not retained. |
| 2 | Launch workspace and inspect initial Chat | Fair — clear composer and initial prompt, but telemetry chrome is decorative/simulated and adds competing status noise. [Screenshot](screenshots/04-chat.png) |
| 3 | Send a simple chat prompt | Poor — prompt is stored and composer clears, but response is implementation/debug copy rather than a useful answer; developer context appears as a large heading. [Screenshot](screenshots/04-chat.png) |
| 4 | Switch to Space and inspect data layers and globe | Poor — controls and layer explanations are visible, but search copy is inconsistent and the Earth/labels are too small or crowded in the captured mode state. [Screenshot](screenshots/02-space.png) |
| 5 | Switch to Telescope | Poor — view reports “Connecting”; maximize/reload controls are disabled and no user-facing retry or explanation is exposed. [Screenshot](screenshots/03-telescope.png) |
| 6 | Open Settings and inspect Personalisation | Fair — controls are grouped into sections, but theme selection is duplicated and the page is long and dense. [Screenshot](screenshots/01-settings.png) |
| 7 | Check Chat at 390 × 844 | Poor — floating mode switcher overlaps the Chat header; the response extends behind the fixed composer. [Screenshot](screenshots/05-mobile-chat.png) |

## Ranked findings

### 1. [P1] Chat displays debug output as the assistant response

**Location:** Chat conversation and assistant response renderer.
**Evidence:** After submitting “What can you help me with?”, the conversation displayed “Local diagnostic assistant response…Chat loop verified…” followed by a heading containing developer runtime and integration context. The prompt itself appeared and the composer cleared, so submission state worked, but the visible content is not a user answer. See [post-send capture](screenshots/01-chat-after-send.png).
**Impact:** Makes the product feel like a test harness, exposes technical context irrelevant to the task, and undermines confidence in whether the assistant is working.
**Recommendation:** Keep diagnostics in a dedicated developer panel/log. In Chat, return concise user-facing fallback copy with next steps (for example, explain that no AI provider is configured and link to AI Configuration). Do not render runtime context as a message. Preserve the user's submitted message on provider failure and announce status changes accessibly.

### 2. [P1] Mobile Chat has overlapping navigation and obscured conversation content

**Location:** Workspace mode switcher, Chat header, message feed, fixed composer.
**Evidence:** At 390 × 844, the mode switcher covers part of the Chat title/header. The long fallback response continues below the visible message region and behind the fixed composer. See [mobile capture](screenshots/05-mobile-chat.png).
**Impact:** Users may lose orientation, miss response content, or have trouble reaching the composer and conversation controls.
**Recommendation:** Put mode navigation in a dedicated row that does not overlay the active panel header. Use a flex/grid column with a min-height-safe scroll region for messages and reserve composer height with bottom padding or a layout row. Test at 320, 390, and 768 CSS px and with enlarged text. W3C reflow guidance calls for content to remain usable at 320 CSS px without two-dimensional scrolling, with fixed content not obscuring reading or focus ([W3C reflow guidance](https://www.w3.org/WAI/WCAG21/Understanding/reflow)).

### 3. [P1] Space and Telescope status do not guide recovery

**Location:** Space globe and Telescope floating feed.
**Evidence:** The stable Space capture shows a small central Earth with overlapping place labels while the surrounding canvas is mostly empty. After entering Telescope, the UI showed “Connecting” and the floating Stellar Telescope Feed offered disabled maximize/reload controls without a reason, elapsed wait, or recovery path. See [Space](screenshots/02-space.png) and [Telescope](screenshots/03-telescope.png).
**Impact:** The user cannot tell whether the scene is loading, degraded, incorrectly framed, or unusable, and cannot recover from the visible state.
**Recommendation:** Define explicit `loading`, `ready`, `degraded`, `offline`, and `failed` states with timestamps and a single available recovery action. When switching modes, reset or preserve camera state deliberately and frame the active target. Use label collision/decluttering and progressive disclosure for dense entities. Keep experimental and live data distinct in the status copy.

### 4. [P2] Spatial search name and instruction disagree

**Location:** Left spatial sidebar search.
**Evidence:** DOM exposes the field as “Search landmarks and orbital entities” while the visible placeholder says “Search layers…”. Typing “Tokyo” removed the layer list but did not show a result or a no-results message. See [Space capture](screenshots/02-space.png).
**Impact:** Users cannot predict whether the field searches map layers or places, and empty feedback makes a valid query look like a broken control.
**Recommendation:** Separate layer filtering from place/entity search, or give the combined field one accurate visible label and placeholder. Show a result list, loading indicator, and explicit no-results state. Keep the accessible name aligned with visible instructions.

### 5. [P2] Settings repeats theme selection and buries advanced controls

**Location:** Settings → Personalisation.
**Evidence:** Six named palette buttons and a Theme Profile dropdown expose the same selection. The screenshot shows multiple dense control sections continuing below the viewport. See [Settings capture](screenshots/01-settings.png).
**Impact:** Duplicate controls increase uncertainty about which control is authoritative; the long settings surface makes frequent tasks harder to scan.
**Recommendation:** Keep one primary palette selector and show a preview/selected state there. Group advanced performance, cursor, and map controls under clear sections or disclosure controls. Provide section navigation that can be used by keyboard and touch; do not hide state changes behind color alone.

### 6. [P2] Runtime health indicators look live without enough provenance

**Location:** Persistent header indicators and spatial data-layer statuses.
**Evidence:** The shell displays CPU/NET/PWR percentages. Space layers mix descriptions such as “Real-time” with explicitly static sample datasets. The existing capability audit classifies several telemetry values as simulated/unverified.
**Impact:** Operators may make decisions based on metrics or data freshness they cannot verify.
**Recommendation:** Label each source as live, cached, simulated, static, or unavailable, and include “updated” time and source where relevant. Remove metrics that do not affect a user decision or visually subordinate them.

## Directly observed behavior and limits

- The launcher rendered and showed Vite active, assistant bridge offline, local assistant ready, and local storage status. The offline state was clear but no repair step was visible in the captured view.
- Chat submission worked at the interaction level: user message appeared, composer cleared, and an assistant turn was appended. The content was debug/test copy.
- Space rendered the layer panel, globe scene, status controls, and static-vs-live layer descriptions. Search behavior did not produce a result/no-result response for “Tokyo”. A Google maps credit appeared in the visual surface.
- Telescope exposed its runtime state and the floating feed window, but stayed connecting; actions were unavailable.
- Settings was reachable and included theme, typography, motion, imagery, and satellite controls. The duplicate theme-selection controls were visible.
- Mobile Chat at 390 × 844 showed header overlap and response content behind the composer.
- Console review found Electron insecure Content-Security-Policy warnings and a warning that OSM 3D buildings failed to load. These are environment/runtime signals, not proof of a user-visible failure in every configuration.
- Keyboard-only, screen-reader, contrast, reduced-motion, real provider credentials, and normal-device WebGL/WWT operation were not fully assessed. This report makes no accessibility-compliance claim.

## Product research synthesis

### Executive read

The current app experience communicates technical ambition more clearly than task completion. The direct walkthrough showed a successful local interaction loop, yet the answer itself exposed its diagnostic nature, so functional success did not translate into user value. In Space and Telescope, the interface presents a rich operational shell but does not consistently explain whether a state is ready, loading, degraded, or recoverable. Mobile layout reduces the amount of work visible at once, but the mode control and composer also obscure content. Existing project documentation independently records similar concerns around chat feedback, simulated telemetry, spatial renderer readiness, responsive panels, and Telescope/WWT verification; that raises confidence that these are not isolated polish issues, although the audit doc includes older observations that were not all revalidated here. The highest-leverage opportunity is a shared truthful-status and recovery pattern used across Chat, Space, and Telescope, followed by a dedicated responsive pass.

### Ranked problems by user goal

| Rank | Problem and user goal | Surface / what breaks | Evidence | Severity / frequency signal / confidence | Product move |
|---|---|---|---|---|---|
| 1 | Get a useful response from Chat | Chat returns internal diagnostic copy instead of help | Fresh app run; existing provisional audit also reported visible send/recovery issues from a prior run | High severity; frequency unknown; high confidence for this run | User-facing offline/unconfigured answer; diagnostics isolated to dev tools; preserve failed input |
| 2 | Read and act on the spatial scene | Search and camera framing do not resolve intent clearly; labels cluster | Search “Tokyo” had no visible result state; Earth/labels were difficult to read in capture | High; frequency unknown; medium-high confidence | Distinguish search types, add empty/results states, reset/fit camera and declutter labels |
| 3 | Know whether Telescope is usable | “Connecting” persists with disabled controls | Fresh direct observation; earlier audit already called iframe/runtime behavior unverified | High; frequency unknown; high confidence for observed state | Add timeout, reason, accessible degraded state, and one recovery path |
| 4 | Use Chat on a phone-sized screen | Navigation overlaps heading; conversation is partly under composer | Fresh 390 × 844 capture; project audit records earlier mobile-layout concerns | High; frequency unknown; high confidence at tested viewport | Reflow layout into explicit rows, keep messages in a reserved scroll region |
| 5 | Configure the interface without ambiguity | Theme can be selected in two places; advanced controls are long and dense | Fresh Settings capture | Medium; frequency unknown; high confidence | Consolidate the selector, organize settings by task and frequency |
| 6 | Trust live data and health indicators | Simulated or static values can appear operational | Fresh view plus project audit classifications | High trust impact; frequency unknown; medium-high confidence | Attach source, freshness, and provenance labels to each data class |

**Frequency note:** There is one direct browser walkthrough and one viewport-size sample, so frequency cannot be estimated. Prior project audit documents are internal secondary evidence, not a representative user sample. No customer interviews, analytics, support tickets, or external user complaint sources were available in this workspace scan.

### Source map

| Source | Contribution | Signal strength |
|---|---|---|
| Current browser run, 2026-10-26 | Screenshots and observed Chat/Space/Telescope/Settings/mobile behavior | Strong for this build and state; not generalizable to all devices/accounts |
| `docs/manual/Operator-Manual.md` | Prior capability claims, trust risks, reported-but-not-reproduced issues, and validation gaps | Useful internal evidence; date-stamped June 2026, so only current-run confirmations are treated as fresh |
| `AGENTS.md` | Known architecture risks including parallel state layers and large components | Strong repository context, not end-user behavior evidence |
| W3C reflow understanding | Grounds narrow viewport and fixed-content recommendations | Normative accessibility guidance, not product-specific evidence ([source](https://www.w3.org/WAI/WCAG21/Understanding/reflow)) |
| React docs on state structure | Grounds advice to avoid duplicated or redundant state | Official implementation guidance, not product-specific evidence ([source](https://react.dev/learn/choosing-the-state-structure)) |
| React docs on effects | Grounds avoiding effects for derived state and redundant render passes ([source](https://react.dev/learn/you-might-not-need-an-effect)) | Official implementation guidance |
| Vercel React Best Practices | Prioritizes waterfalls, bundle size, and unnecessary re-render work ([source](https://vercel.com/blog/introducing-react-best-practices)) | Practitioner guidance; use profiling before optimization |

Public complaint scan: not performed. Silver Wolf VI is treated here as a local workspace product, and no public product community or customer-support source was identified. The research request was satisfied through direct app inspection and project evidence; public references only support best-practice recommendations.

## Areas to apply best practices

### Product design and accessibility

1. **Truthful system status:** Create a shared status vocabulary and component for loading, live, cached, simulated, static, degraded, and unavailable states. Pair each state with source/freshness and a recovery action. Do not use a bright status color alone.
2. **Mobile layout:** Make Chat’s header, mode switcher, message feed, and composer separate layout regions. Reserve composer height; keep message scroll padding above it; keep the mode switcher out of the title’s hit area. Test at 320, 390, and tablet widths plus large text.
3. **Search feedback:** Provide specific search semantics and visible result, loading, empty, and error states. Make the visible instruction and accessible name match.
4. **Telescope recovery:** Add timeout and error states for the WWT/client connection; enable retry only when meaningful, and explain disabled actions. Make status announcements available to assistive technology.
5. **Settings information architecture:** Remove redundant theme controls or make one explicitly a preview. Separate common appearance choices from expert map/performance settings; preserve current value, keyboard focus, and reset affordances.
6. **Content boundary:** Keep diagnostics, user messages, and assistant content as separate data types/renderers. Add a check that developer context cannot be emitted into the normal message feed.

### React and repository engineering

1. **Reduce state duplication risk:** `AGENTS.md` documents parallel Zustand state layers (`src/core/state/*` and legacy `src/store/*`). Before adding workflow state, trace the existing owner and avoid mirroring values in component state. Prefer derived values during render when possible, consistent with [React state guidance](https://react.dev/learn/choosing-the-state-structure).
2. **Split responsibility in large surfaces:** `AGENTS.md` flags `LeftPanel.tsx`, `RightPanel.tsx`, `WorldWideTelescopeView.tsx`, `GoogleEarthRemix.tsx`, and `uiStore.ts` as very large files. Extract feature-owned components/hooks for search, status, timeline, settings groups, and renderer lifecycle before adding more branches.
3. **Avoid redundant effect state:** Review effects that copy derived props/store data into local state or immediately set state after render. Compute pure derived data during render and reserve effects for external synchronization ([React guidance](https://react.dev/learn/you-might-not-need-an-effect)).
4. **Profile before memoizing:** The chat already memoizes `MessageBubble`; keep memoization only where profiling shows a cost. Prioritize expensive globe/render work, repeated selectors, and updates that cause unrelated panels to re-render. React’s [Developer Tools](https://react.dev/learn/react-developer-tools) can help locate actual render churn.
5. **Prioritize async and bundle work:** Map/globe, telescope, and optional connector features are natural candidates for lazy loading and parallel independent initialization. Use the repository’s build/profiling setup to confirm impact; Vercel’s guidance similarly prioritizes eliminating waterfalls and reducing shipped bundle size before micro-optimizations ([overview](https://vercel.com/blog/introducing-react-best-practices)).
6. **Make test harness evidence current:** The existing audit references port mismatch, screenshot timeout, and unverified runtime paths. Update browser smoke evidence and deterministic fixtures for Space/WWT before making readiness claims. This is a recommendation; tests were not run in this audit.

## Opportunity map

### Fix this week

- Replace diagnostic assistant text with user-facing local/offline guidance; move diagnostics into developer-only UI.
- Fix mobile mode/header/composer overlap and ensure conversation scroll area ends above the composer.
- Align spatial search name, placeholder, and actual behavior; add a no-results message.
- Add a visible Telescope timeout/degraded state with a recovery instruction.
- Remove duplicate theme selection or explicitly designate one control as preview.

### Fix this quarter

- Establish common data provenance and health-state patterns across launcher, telemetry, Space layers, and Telescope.
- Add label decluttering and predictable camera framing on mode changes.
- Split the large panel and Telescope components by feature ownership, keeping `App`/shell components as composition glue.
- Consolidate state ownership after tracing legacy store consumers; document the canonical state path.
- Rework Settings into task-oriented groups with a responsive section index.

### Needs deeper research

- Observe operators completing a real task (for example, identify a recent earthquake, inspect an entity, and save/share findings) to learn which panels and data matter.
- Interview users about whether they expect Chat to work offline, how they interpret “live telemetry,” and what recovery they need when providers are absent.
- Measure completion, time-to-first-useful-result, search success, abandoned sends, and renderer failure recovery.
- Test keyboard and screen-reader flows, focus visibility, zoom/reflow, and reduced-motion with representative users and assistive technology.

## Screenshot evidence

- [02 — Space](screenshots/02-space.png)
- [03 — Telescope](screenshots/03-telescope.png)
- [04 — Chat](screenshots/04-chat.png)
- [05 — Mobile Chat at 390 × 844](screenshots/05-mobile-chat.png)
- [Settings — Personalisation](screenshots/01-settings.png)

All retained images were captured from the in-app Browser at the local Vite app. Desktop captures were at 1280 × 720; mobile capture was at 390 × 844 CSS px. Screenshots were inspected after saving. The launcher screenshot was displayed during the walkthrough but could not be retained after its dev-server session ended. Browser console review covered warnings/errors exposed in the current tab; it did not include a complete network or accessibility audit.
