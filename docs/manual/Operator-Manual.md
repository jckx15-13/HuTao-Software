# Silver Wolf VI Provisional Capability Audit

This document is a provisional capability audit for Silver Wolf VI. It records what is supported by source inspection, what was visible in limited fallback checks, what remains unverified, and where current behavior may confuse or harm user trust.

Audit date: 2026-06-20; updated with Vite/in-app Browser UI pass on 2026-06-22
Primary app: `silver-wolf-vi` React/Vite workspace
Evidence reviewed: `README.md`, `DOCS.md`, `src/`, current static bundle in `dist/`, in-app Browser fallback smoke checks, Vite server logs, Vite dev-server DOM checks on `127.0.0.1:3000`, and user-reported issue notes.

This is not a runtime certification, accessibility certification, or user-satisfaction certification. Normal-browser validation is still required for WebGL/Cesium rendering, WWT iframe behavior, live data flows, timeline playback, satellite visualization, embedded-browser behavior, keyboard-only use, screen-reader clarity, readable failure messaging, and non-expert discoverability.

## Evidence Standard

Statuses in this document use separate evidence dimensions:

- **Evidence Source**: `Source only`, `Static dist bundle`, `In-app Browser fallback`, `Vite dev-server logs`, `Normal browser runtime`, or `User-reported, not reproduced`.
- **Implemented in code**: source files, stores, components, services, or hooks exist.
- **User-accessible UI**: the feature is reachable through visible controls in the rendered app.
- **Runtime validated**: the behavior was verified in an environment close enough to normal user runtime to support a functional claim.
- **User promise satisfied**: the implementation appears to deliver the user-facing value implied by the claim, not just a shell or partial control.
- **Confidence**: High, Medium, or Low based on directness, environment fidelity, and user-impact clarity.

Fallback/static validation confirms UI reachability only. It does not certify normal interactive runtime behavior for WebGL, iframe integrations, network streams, live telemetry, browser-specific input behavior, accessibility, or delivered user value.

Visible controls are not treated as proof of usability. Source presence is not treated as proof that the feature satisfies the user promise. User reports are tracked as follow-up risks unless directly reproduced in this audit.

Severity is based on likely user consequence:

- **Critical**: breaks a core flow, creates data-loss perception, or leaves the user unable to recover.
- **High**: blocks a major workflow or materially misleads users.
- **Medium**: creates usability friction, unclear state, or partial workflow degradation.
- **Low**: copy polish or non-critical mismatch.

## 1. Claimed Capabilities

| Capability | Evidence Source | Implemented in code | User-accessible UI | Runtime validated | User promise satisfied | Status | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Boot launcher | Static dist bundle; In-app Browser fallback; Vite dev-server logs | Yes: `LauncherPage.tsx` | Yes | Partly in Vite/in-app Browser; screenshot capture failed | Partly: entry shell appeared, but full normal-browser certification remains pending | Provisionally verified in Vite/in-app Browser | Medium |
| Chat workspace | Vite dev-server logs; In-app Browser fallback; Source only | Yes: `ChatPanel`, `ChatComposer`, chat store | Yes | Failed for visible submit confirmation in Vite/in-app Browser | No: submitted messages and recovery/error messages were not visible after send | UI visible; core send feedback failed | High |
| Gemini AI response path | Source only; Vite/fallback log | Yes: `useAIChat.ts` uses `@google/genai` | Model settings expose Gemini options | No | No: response path not proven without valid key/runtime | Implemented in code; normal response unverified | Medium |
| Local assistant path | Source only | Yes: `aiChat()` path for local models | Model settings expose local options | No | Unverified | Implemented in code; user value unverified | Low |
| Active chat persistence | Source only | Yes: `useChatPersistence` and store persistence paths exist | Not directly labeled | No | Unverified: active-message restore not proven | Implemented in code; user value unverified | Medium |
| Multi-session/project chat | Static dist bundle; Source only | Yes: session list and create/delete handlers | Yes | No | Unverified: persistence and project value not proven | UI visible; function unverified | Medium |
| Settings/personalisation | Source only | Yes: settings modules and Zustand state | Likely visible through settings UI | No | Unverified | Implemented in code; user value unverified | Medium |
| Custom cursor | Source only; User-reported, not reproduced | Yes: cursor engine/components | Intended through app shell | No | Unverified; possible comfort/accessibility risk | Implemented; reported defects not reproduced | Low |
| Space/orbital view | Static dist bundle; In-app Browser fallback; Vite dev-server logs; Source only | Yes: `CenterPanel`, `GoogleEarthRemix`, Cesium background | Yes | Partly; Space sidebar rendered, but main pane stayed Chat and no renderer/degraded state was visible | No: spatial user value was not delivered in this pass | UI exposed; state/function mismatch reproduced | High |
| Cesium/WebGL globe | Source only | Yes: Cesium hooks/background components | Intended in Space mode | No | No evidence of delivered globe interaction | Implemented in code; runtime unverified | Low |
| Fallback 2D globe | Source only | Yes: canvas fallback path in `GoogleEarthRemix` | Intended | No | Unverified | Implemented in code; user value unverified | Low |
| Telescope/WWT controls | Static dist bundle; Source only | Yes: `WorldWideTelescopeView`, presets, PiP, postMessage code | Yes inside Space controls | No | Partly: controls visible, telescope function unverified | Controls visible; WWT runtime unverified | Medium |
| Top-level Telescope mode | Source only; Static dist bundle | Store supports `telescope`; switcher lacks visible tab | No standalone tab | Not applicable | No: claim does not match reachable UI | Documentation/UI mismatch | High |
| Timeline playback | Static dist bundle; Source only; User-reported, not reproduced | Yes: timeline state, slider, lanes, refetch hook | Yes in Space | No | Unverified; user may expect playback to work | UI exposed; function unverified | Medium |
| Embedded browser panel | Source only | Yes: sandboxed iframe browser in `RightPanel` | Yes tab label | No | Unverified; blocked-page behavior not proven | UI exposed; iframe behavior unverified | Medium |
| Satellite tracker | Static dist bundle; Source only; User-reported, not reproduced | Yes: curated data, filters, propagation, telemetry cards | Yes | No | Unverified; spatial correctness not proven | Controls visible; spatial correctness unverified | Medium |
| Ingestion plugins | Static dist bundle logs; Source only | Yes: ISS, earthquakes, weather, satellites, density | Plugin labels visible | No | Unverified; live data value not proven | Startup suggested; live polling unverified | Medium |
| Diagnostics/telemetry panels | Static dist bundle; Source only | Yes | Yes tab labels | No | Unverified; simulated vs live state unclear | UI labels visible; panel behavior unverified | Medium |
| Odysseus console | Source only; UI label | Yes | Yes tab label | No | Unverified | UI exposed; backend readiness unverified | Low |
| Notion connector settings | Source only | Yes: settings UI fields | Yes in settings by source | No | No: sync and safe secret handling not validated | UI only unless backend sync is validated | Medium |

## 2. Validation Criteria

Use these checks before promoting any capability from partial or unverified to verified:

| Area | Validation criteria | Required evidence type |
| --- | --- | --- |
| Startup | App renders nonblank content from dev server and static bundle; no framework overlay; no blocking console errors; bridge offline state is graceful. | Screenshot, DOM assertion, console errors, failed network requests |
| Chat | Enter text; send by Enter and button; verify user message appears; verify missing-key/system error appears when no Gemini key exists; verify composer clears only after valid submit; verify reload restores persisted messages. | UI assertion, keyboard interaction proof, store/storage assertion, console assertion |
| Failure messaging | Missing config, blocked dependency, no data, slow loading, and degraded mode all show plain-language state, reason, and recovery action. | UI assertion, screenshot, screen-reader-readable text/ARIA check |
| Space mode | Switch Chat -> Space; globe or fallback globe renders; side panels remain usable; controls do not overlap; console has no blocking errors. | Screenshot, DOM assertion, console assertion |
| Cesium globe | Verify WebGL globe, camera drag, zoom, compass, recenter, borders, terrain, and selected targets in a normal browser. | Screenshot/canvas assertion, interaction proof, console/network assertion |
| Telescope | Select preset; verify WWT iframe opens or degraded state appears; verify target telemetry changes; verify PiP controls work. | UI assertion, iframe/network assertion, screenshot |
| Timeline | Toggle playback; scrub slider; change speed; verify current time changes and plugin refetch occurs with real or fixture data. | UI assertion, store assertion, network/plugin assertion |
| Satellites | Select ISS and a curated satellite; verify marker/trail/frustum remain above globe and telemetry updates. | Screenshot/canvas assertion, UI assertion, telemetry assertion |
| Embedded browser | Load an iframe-friendly URL; load a blocked/bot-check URL; verify clear user feedback for both outcomes. | Iframe assertion, blocked-state assertion, console/network assertion |
| Settings | Change theme, opacity, motion, sound, map, satellite, AI, and connector settings; verify intended persistence and no unsafe secret handling. | UI assertion, persisted storage check, security review |
| Accessibility baseline | Test keyboard-only navigation, focus order, visible focus, readable labels, color contrast, motion-reduction path, and screen-reader clarity for critical flows. | Keyboard walkthrough, accessibility scan, screen-reader or proxy notes, contrast evidence |

## 3. Claims vs Observed Behavior

| Claim / documented behavior | Source | Evidence Source | Observed behavior | User impact | Severity | Trust risk | Status | Confidence | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Adaptive cyberpunk chat interface with Gemini responses | `README.md`, `DOCS.md` | Source only; Static dist bundle log; Vite dev-server logs; In-app Browser fallback | Chat UI and Gemini dispatch code exist. In the Vite/in-app Browser pass, typing enabled Send, but sending cleared the composer and the submitted text did not appear in the feed; no visible recovery/error message appeared. | Users may think a prompt was lost or ignored. | Critical | Data-loss perception; silent failure | Failed visible feedback check | High | Preserve submitted messages, show accessible failure/recovery copy, and only clear input after the message is safely represented. |
| Local chat history | `README.md`, `DOCS.md` | Source only | Active-message persistence code exists. Multi-session/project metadata persistence is not proven. | Users may expect all sessions to survive reload when only part of the state is proven. | High | Overclaimed persistence | Source-supported; runtime unverified | Medium | Document active-message persistence only, or persist all sessions and prove restore. |
| Spatial/geospatial workspace | Previous manual | Static dist bundle; In-app Browser fallback; Vite dev-server logs; Source only | In the Vite/in-app Browser pass, clicking Space activated spatial sidebar controls, but the main pane still showed the Chat feed/composer and no canvas, iframe, or degraded renderer message was observed. | Users may assume a map/globe is operational when only side controls are visible. | High | UI theater / overclaimed capability | State/function mismatch reproduced | High | Render the spatial surface in the main pane or show a plain unavailable/degraded state when the renderer is absent. |
| Three top-level modes: Chat, Orbital, Telescope | Previous manual | Source only; Static dist bundle | Visible switcher exposes `Chat` and `Space`; Telescope exists as Space submode/focus target, not as a standalone visible top-level tab. | Users may search for a mode that does not exist in the visible UI. | Medium | Discoverability mismatch | Documentation/UI mismatch | High | Update docs/UI copy, or add a Telescope tab. |
| Telescope integration is complete | Previous manual | Source only; Static dist bundle; User-reported, not reproduced | WWT controls and presets render in Space. WWT iframe/runtime was not verified; telescope seed instability is reported by the user but not reproduced in this audit. | Users may trust a celestial view that may be blocked, slow, or only partially connected. | High | Partial integration presented as complete | Controls visible; runtime unverified | Medium | Add WWT health state, degraded message, and preset E2E tests. |
| Timeline feature is functional | Previous manual/user-facing controls | Source only; Static dist bundle; User-reported, not reproduced | Timeline controls render, and source has playback/refetch hooks. Functional playback was not proven; nonfunctional behavior is user-reported, not reproduced here. | Users may believe time controls affect data when that behavior is unproven. | High | Misleading control state | UI exposed; function unverified | Medium | Mark experimental until fixture-backed playback tests pass. |
| Embedded browser works | Right panel UI | Source only | Browser tab and sandboxed iframe implementation exist. Actual iframe loading, blocked-site handling, and bot-check behavior were not exercised. | Users may confuse blocked iframes with app failure. | Medium | Poor failure transparency | UI exposed; function unverified | Medium | Call it a sandboxed browser preview and add blocked-site messaging. |
| Satellite tracking is reliable | Previous manual/source | Source only; Static dist bundle; User-reported, not reproduced | Satellite controls and propagation code exist. Visual marker correctness was not verified; "satellite in globe" is user-reported, not reproduced here. | Users may make decisions from incorrect or unclear spatial placement. | High | Misleading live/spatial data | Controls visible; spatial correctness unverified | Medium | Add visual tests for altitude, occlusion, trails, and selected state. |
| Real-time telemetry | Previous manual/UI labels | Source only; Static dist bundle logs | Source and startup behavior suggest plugin registration. Live polling, streams, and data freshness were not fully validated; headless mode skipped live streams. | Users may mistake simulated or stale data for live telemetry. | High | Simulated/live ambiguity | Partial | Medium | Label simulated metrics and distinguish live plugin telemetry. |
| Launcher storage tile says IndexedDB/Secured | `LauncherPage.tsx` | Source only; Static dist bundle | Main UI store and chat persistence use localStorage paths; launcher copy appears stronger than verified storage evidence. | Users may overtrust local storage safety or persistence guarantees. | Medium | Security/storage overclaim | Copy mismatch | High | Change launcher copy to "Local browser storage" unless specifically referencing an IndexedDB cache. |

## 4. Humane Failure-State Review

| Capability / failure state | Evidence Source | What the user may see | Why it matters | Severity | Trust risk | Clear recovery message needed |
| --- | --- | --- | --- | --- | --- | --- |
| Chat missing key or failed AI response | Vite dev-server logs; In-app Browser fallback; Source only | Prompt clears after Send, but submitted text and recovery/error message are not visible. | Users may believe their message was lost or the app is broken. | Critical | Data-loss perception; silent failure | "AI is not configured. Your message was kept locally. Add a Gemini key in settings or switch to a local model." |
| Space renderer unavailable | Vite dev-server logs; Static dist bundle; Source only | Space controls appear and the Space tab becomes active, but the main pane may still show Chat with no renderer status. | Users may mistake a control shell for an operational spatial system. | High | UI shell mistaken for live renderer | "Space controls are available, but the globe renderer has not loaded. Try reload, fallback mode, or check WebGL support." |
| WWT iframe blocked or slow | Source only; User-reported, not reproduced | Telescope controls may render while iframe is blank, slow, or blocked. | Users may not know whether the target, network, or app failed. | High | Partial integration presented as working | "Telescope feed could not load. The controls remain available, but the sky view is offline. Retry or open WWT externally." |
| Timeline unavailable or no data | Source only; User-reported, not reproduced | Playback controls may render without proven data/time effects. | Users may believe time navigation controls real telemetry when it may not. | High | Misleading control state | "Timeline playback is experimental. No verified time-series data is available for this layer." |
| Satellite marker uncertainty | Source only; User-reported, not reproduced | Satellite controls appear; visual placement correctness is unverified. | Incorrect spatial placement can mislead users more than no display. | High | Misleading spatial data | "Satellite position is estimated and not yet visually verified. Use telemetry as provisional." |
| Embedded browser blocked page | Source only; User-reported, not reproduced | A page may show bot verification, frame denial, blank iframe, or blocked state. | Users may blame the app or think navigation failed silently. | Medium | Poor failure transparency | "This site blocks embedded preview. Open it in a new browser tab." |
| Connector/secrets unavailable | Source only | Notion settings exist, but backend sync and safe secret handling are unverified. | Users may paste sensitive credentials into a capability that is not validated for production use. | High | Credential handling ambiguity | "Connector sync is not enabled in this build. Do not enter production secrets until backend/OAuth support is verified." |

## 5. State Honesty Review

| Feature | Current state label | Evidence Source | Honesty risk | Required label / indicator |
| --- | --- | --- | --- | --- |
| Launcher | Static fallback / Vite shell verified | Static dist bundle; In-app Browser fallback; Vite dev-server logs | May appear broadly validated when screenshot and full normal-browser checks are incomplete. | "Launcher shell verified; full browser/accessibility certification pending." |
| Chat | Experimental / Failed visible feedback check | Source only; Static fallback log; Vite dev-server logs | Send can clear input without showing submitted/error message. | "AI responses require configuration; submitted messages are preserved locally; failures are visible." |
| Space shell | Static fallback / State mismatch | Static dist bundle; Vite dev-server logs | Controls can imply the renderer is live while the main pane remains Chat. | "Space controls loaded; spatial renderer unavailable" until the main spatial surface is actually visible. |
| Cesium globe | Unverified | Source only | Source presence may be mistaken for rendered behavior. | "Globe renderer not certified in this audit." |
| Telescope controls | Experimental | Static dist bundle; Source only | Controls visible; WWT runtime not proven. | "Telescope controls available; live sky feed unverified." |
| Timeline | Experimental | Static dist bundle; Source only | Playback controls may appear authoritative. | "Timeline controls experimental; data effects unverified." |
| Satellite tracker | Experimental | Static dist bundle; Source only; User-reported, not reproduced | Users may trust spatial placement. | "Satellite visualization provisional; marker correctness pending." |
| Diagnostics/telemetry | Simulated / Unverified mix | Static dist bundle; Source only | Telemetry labels may look live. | "Label simulated, cached, and live values distinctly." |
| Embedded browser | Experimental | Source only | Users may expect a full browser. | "Sandboxed preview; some sites block embedding." |
| Notion connector | Unavailable / Source only | Source only | Users may assume sync and safe secrets work. | "Connector UI present; production sync not verified." |
| Top-level Telescope mode | Not user-accessible as claimed | Source only; Static dist bundle | Store-only mode can be documented as visible. | "Telescope is a Space submode unless a visible tab is added." |

## 6. Accessibility and Usability Caution

This audit did not perform full accessibility testing. No WCAG compliance claim is made.

| Area | Keyboard use | Screen-reader clarity | Readable failure messaging | Non-expert discoverability | Notes |
| --- | --- | --- | --- | --- | --- |
| Launcher | Not assessed | Not assessed | Partly visible in fallback | Not assessed | Bridge-offline state needs plain-language recovery copy. |
| Chat | Partly assessed | Unverified; no live/status/log region observed | Failed visible feedback check | Partly assessed | Textarea lacked explicit `aria-label`/`aria-labelledby`; failed-send states must be visible and announced. |
| Space controls | Partly assessed | Unverified; no status region observed | Unverified | Partly assessed | Dense controls and custom cursor may increase cognitive load; active Space state did not prove spatial surface availability. |
| Responsive layout | Partly assessed | Not assessed | Unverified | Failed at mobile workspace width | At `390x844`, side panels consumed the viewport and the center `main` region reported width `0`. |
| Telescope/WWT | Not assessed | Not assessed | Partly implemented by source | Not assessed | Iframe failures need accessible degraded state. |
| Timeline | Not assessed | Not assessed | Unverified | Not assessed | Playback controls should explain experimental/no-data states. |
| Satellite tracker | Not assessed | Not assessed | Unverified | Not assessed | Spatial-only cues need textual status and uncertainty labels. |
| Embedded browser | Not assessed | Not assessed | Unverified | Not assessed | Blocked iframe state must be screen-reader-readable. |
| Settings/connectors | Not assessed | Not assessed | Unverified | Not assessed | Secret-entry risks require plain-language warnings. |

Future validation should include keyboard-only walkthroughs, visible focus checks, screen-reader/proxy review, contrast checks, reduced-motion behavior, and mobile/touch review. Until then, "visible in UI" means only visually present in the checked environment, not accessible or usable by all users.

## 7. Functional Gaps

### Audit / Environment Blockers

| Gap | Evidence Source | User impact | Severity | Trust risk | Expected humane behavior |
| --- | --- | --- | --- | --- | --- |
| Automated Puppeteer test harness timed out before completion. | Test command output | The scripted regression suite cannot currently certify the UI end to end. | High | Passing build may be mistaken for passing product behavior. | Fix the harness runtime/port assumptions and ensure it exits with a report. |
| Browser screenshot capture timed out in the in-app Browser. | In-app Browser runtime | Visual evidence is weaker than DOM evidence for this pass. | Medium | UI claims may lack screenshot support. | Repair screenshot capture or validate with an alternate approved visual path. |
| Normal-browser validation is incomplete. | Audit scope | WebGL, WWT, live telemetry, embedded browser, and timeline remain unproven. | High | Users may trust unverified integrations. | Keep statuses provisional until normal-browser evidence exists. |
| Production bundle does not expose full store debug hooks. | Static dist bundle | Store-level runtime assertions are limited. | Medium | Test evidence may be weaker than it appears. | Use DOM, screenshots, console, and network evidence as primary proof. |

### Product / Documentation Gaps

| Gap | Evidence Source | User impact | Severity | Trust risk | Expected humane behavior |
| --- | --- | --- | --- | --- | --- |
| Documentation/UI should not claim standalone Telescope mode without a visible tab. | Source only; Static dist bundle | Users search for a control that is not there. | Medium | Misleading feature map | Describe Telescope as a Space submode or add a visible mode. |
| Embedded browser copy can imply a full browser. | Source only | Users may blame the app when sites block iframes. | Medium | Poor failure transparency | Use "sandboxed browser preview" and explain blocked pages. |
| Timeline controls appear more complete than proven. | Source only; User-reported, not reproduced | Users may expect playback to control live or historical data. | High | Misleading control state | Label experimental until fixture-backed playback tests pass. |
| Launcher storage/security wording is stronger than verified implementation. | Source only; Static dist bundle | Users may overtrust storage safety. | Medium | Security/storage overclaim | Say "Local browser storage" unless stronger storage is implemented and verified. |
| Multi-session chat/project persistence is not proven. | Source only | Users may expect project sessions to survive reload. | High | Data-loss perception | Persist all sessions or clearly document what persists. |
| Space tab activates without a visible spatial main pane in Vite/in-app Browser. | Vite dev-server logs; In-app Browser fallback | Users see spatial controls but not the promised spatial surface. | High | UI theater / misleading state | Render the Space surface in `main` or show a degraded renderer message. |

### User-Impact and Trust Risks

| Risk | Evidence Source | User impact | Severity | Trust risk | Expected humane behavior |
| --- | --- | --- | --- | --- | --- |
| Chat send does not visibly confirm submitted/error messages in the Vite/in-app Browser pass. | Vite dev-server logs; In-app Browser fallback | User may think input vanished. | Critical | Data-loss perception | Always show submitted message and visible error/recovery state. |
| Mobile workspace collapses the center surface. | Vite dev-server logs; In-app Browser fallback | Users on narrow screens may be unable to use the main Chat/Space content. | Critical | Core workflow blocked on mobile | Collapse side panels behind explicit controls and preserve a usable `main` width. |
| Simulated or stale telemetry may look live. | Source only; Static dist bundle | User may act on unclear data freshness. | High | Live/simulated ambiguity | Label each telemetry value as live, simulated, cached, or unavailable. |
| Dense visual controls may overwhelm non-expert users. | Static dist bundle; Source only | Users may not understand what is safe to use. | Medium | Cognitive load increase | Provide plain labels, tooltips, and state summaries without jargon. |
| Custom cursor and animations may affect comfort or precision. | Source only; User-reported, not reproduced | Users may struggle with focus, pointer accuracy, or motion sensitivity. | Medium | Accessibility/usability barrier | Provide reliable native-cursor/reduced-motion path and verify it. |
| Iframe-dependent features may fail without clear ownership. | Source only | User cannot tell if the app, site, or network failed. | Medium | Failure attribution confusion | Show plain-language blocked/offline/retry states. |

### Reported, Not Reproduced In This Audit

- Chat message disappears after Enter/Send.
- Custom cursor does not stay aligned after app/browser focus changes.
- Custom cursor overlaps the spatial HUD cursor.
- Satellite marker glitches or appears inside the globe.
- Telescope seed/preset behavior is unreliable.
- Timeline feature is not functional.
- Embedded browser encounters bot verification or frame-blocking pages.

## 8. Optimization Opportunities

| Opportunity | Basis | User impact | Severity | Effort |
| --- | --- | --- | --- | --- |
| Update launcher storage copy from "IndexedDB / Secured" to accurate storage wording. | Copy alignment | Reduces false security/persistence expectations. | Medium | Quick win |
| Update docs to say `Chat` and `Space` are the visible top-level modes. | Copy alignment | Reduces navigation confusion. | Medium | Quick win |
| Add sandboxed-browser caveat and blocked-page messaging. | Runtime reliability / UX | Helps users recover from iframe blocking. | Medium | Quick win |
| Add visible WWT degraded state when the iframe does not load. | Runtime reliability / UX | Prevents blank/ambiguous telescope failures. | High | Quick win |
| Fix verification harness/dev-server port mismatch (`3005` vs older `3000`). | Test coverage | Prevents false audit blockers. | High | Quick win |
| Add E2E tests for launcher, Chat send missing-key handling, Space switcher, measurement, satellite selection, telescope preset selection, and browser blocked-state handling. | Test coverage | Converts provisional claims into reproducible evidence. | High | Medium |
| Add deterministic fixture mode for spatial plugins and timeline playback. | Test coverage / runtime reliability | Allows users and QA to distinguish no-data from broken behavior. | High | Medium |
| Persist chat sessions consistently or simplify session UI claims. | Product logic | Reduces data-loss perception. | Critical | Medium |
| Add console/network capture to the verification harness. | Test coverage | Improves diagnosis without overclaiming. | Medium | Medium |
| Split simulated system metrics from live data telemetry in the UI. | Copy alignment / architecture | Preserves trust in telemetry. | High | Medium |
| Create a runtime health service for Cesium, WWT, plugin streams, bridge, config, and browser-preview readiness. | Architecture | Gives users clear operational state. | High | High |
| Move connector secrets out of client-side persisted state before claiming Notion production readiness. | Security architecture | Reduces credential-handling risk. | High | High |
| Add normal-browser visual regression screenshots for Space, telescope, and satellite views. | Test coverage | Confirms the visible experience across core modes. | High | High |

## 9. Detailed QA Test Cases

| Test case ID | Requirement | Preconditions | Steps | Expected result | Actual result placeholder | Evidence type required | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWV-QA-001 | Static bundle renders launcher | Static server serving `dist` | Open `/?fallback=true` | Launcher appears; root has content; bridge offline shown gracefully | Static fallback passed during audit | Screenshot, DOM assertion, console log | P0 | Provisional, not normal-runtime certification. |
| SWV-QA-002 | Dev server renders app | Vite server on `3000` or `3005`, clean dependencies | Open `/` or `/?fallback=true` | App renders nonblank content | Passed DOM identity/nonblank check on Vite `3000`; screenshot capture timed out | Screenshot, DOM assertion, console/network logs | P0 | Build/lint passed; screenshot path still needs repair. |
| SWV-QA-003 | Launch enters workspace | Launcher visible | Click Launch Workspace | Workspace panels and Chat mode render | Static fallback passed during audit | UI assertion, screenshot | P0 | Provisional. |
| SWV-QA-004 | Chat send displays submitted message | Workspace Chat visible | Type prompt; click Send | User message appears; composer clears; processing/error/response appears | Failed in Vite/in-app Browser: composer cleared, submitted text and recovery/error message were not visible | UI assertion, store/storage assertion, console log | P0 | Covers disappearing-message issue and data-loss perception. |
| SWV-QA-005 | Chat Enter submit behaves like Send | Workspace Chat visible | Type prompt; press Enter | Same behavior as Send; Shift+Enter inserts newline | Pending | UI assertion, keyboard interaction proof | P0 | Regression-sensitive. |
| SWV-QA-006 | Missing Gemini key is user-visible | No `GEMINI_API_KEY` or failed response path | Send prompt | Plain-language system message explains missing key and recovery | Failed visible feedback check in Vite/in-app Browser; no live/status/log region observed | UI assertion, console assertion, accessible text check | P0 | Console-only evidence is insufficient; state must be visible and announced. |
| SWV-QA-007 | Chat history persists | Sent visible message | Reload app | Active chat restores message list or clearly states what is not persisted | Pending | localStorage assertion, UI assertion | P1 | Validate active-message behavior. |
| SWV-QA-008 | Space mode UI shell is reachable | Workspace loaded | Click Space | Spatial HUD, side panels, timeline controls render with unverified/live labels | Partly passed: spatial sidebar rendered, but main pane still showed Chat and no degraded renderer label appeared | Screenshot, DOM assertion | P0 | State honesty failure; does not prove globe/iframe rendering. |
| SWV-QA-009 | Globe renders in normal browser | WebGL-capable browser | Enter Space | Cesium or fallback globe visible; controls respond; degraded state appears if renderer fails | Pending | Screenshot/canvas assertion, interaction proof, console/network logs | P0 | Required before claiming spatial readiness. |
| SWV-QA-010 | Landmark search selects target | Space mode | Search/select landmark | Right panel shows target; camera/fallback focus changes or degraded state explains limitation | Pending | UI assertion, screenshot | P1 | Include context panel assertion. |
| SWV-QA-011 | Measurement ruler computes distance | Space mode | Select point A/B | Distance appears with expected km tolerance; line renders where supported | Pending | UI assertion, screenshot, numeric tolerance check | P1 | Can use fixed landmarks. |
| SWV-QA-012 | Satellite selection is spatially correct | Space mode with globe | Select ISS and curated satellite | Marker, trail, and telemetry update; object stays above globe; uncertainty labels are present | Pending | Screenshot/canvas assertion, telemetry assertion | P0 | Covers reported satellite glitch. |
| SWV-QA-013 | Telescope preset opens/focuses WWT | Space mode | Select star preset | Telescope target changes; iframe/PiP appears or accessible degraded state is shown | Pending | UI assertion, iframe/network assertion, screenshot | P0 | Covers reported telescope seed instability. |
| SWV-QA-014 | Timeline scrub drives playback state | Space/telescope controls | Enable playback; scrub; change speed | Time display and plugin time range update, or experimental/no-data state is clear | Pending | UI assertion, store assertion, plugin/network assertion | P0 | Treat as experimental until passing. |
| SWV-QA-015 | Embedded browser handles allowed URL | Browser tab open | Navigate to iframe-friendly URL | Content loads in iframe | Pending | Iframe assertion, screenshot | P1 | Use controlled local fixture. |
| SWV-QA-016 | Embedded browser handles blocked URL | Browser tab open | Navigate to blocked/bot-check site | Clear blocked/degraded message appears with external-open path | Pending | Iframe/network assertion, UI blocked-state assertion | P1 | Do not imply full browser support. |
| SWV-QA-017 | Settings update UI state | Workspace loaded | Change theme, opacity, motion, sound | UI updates and intended settings persist; unsafe secret handling is not present | Pending | UI assertion, storage assertion, security review | P1 | Include connector caution. |
| SWV-QA-018 | Responsive layout does not overlap | Desktop and mobile widths | Open Chat, Space, right panels | Controls remain reachable; text does not overlap | Failed at `390x844`: center `main` reported width `0` while side panels consumed the viewport | Desktop/mobile screenshots, DOM assertions | P1 | Include custom cursor/HUD overlap checks; mobile side panels need responsive collapse. |
| SWV-QA-019 | Keyboard-only baseline | App loaded | Navigate launcher, Chat, Space controls, settings, browser tab without mouse | Focus order is logical; visible focus is present; core actions reachable | Pending | Keyboard walkthrough, screenshot/DOM evidence | P0 | Required before treating visible UI as broadly usable. |
| SWV-QA-020 | Screen-reader-readable failure states | Failure states configured or simulated | Inspect missing-key, WWT blocked, browser blocked, no-data states | State, reason, and recovery path are readable without visual-only cues | Pending | Accessibility tree/proxy notes, DOM assertions | P0 | No WCAG claim until complete pass. |
| SWV-QA-021 | Reduced motion/native cursor comfort path | Settings available | Enable reduced motion/native cursor path where available | Motion/cursor effects reduce or disable without breaking use | Pending | UI assertion, settings persistence check | P1 | Covers comfort and precision concerns. |

## 10. Final Product Readiness Assessment

This is a provisional readiness assessment based on mixed evidence sources: source inspection, static bundle fallback checks in the in-app Browser, Vite dev-server logs, limited Vite/in-app Browser DOM interaction checks, and user-reported issues that were not all reproduced here. It should not be treated as a full runtime, accessibility, or user-satisfaction certification.

Confirmed or provisionally confirmed in this audit:

- Static production bundle rendered the launcher in the in-app Browser fallback environment.
- Vite dev-server rendered nonblank launcher/workspace DOM on `127.0.0.1:3000`.
- Launch Workspace entered the workspace in the in-app Browser environment.
- Space mode UI shell rendered key controls and panels, but also exposed a state mismatch where the main pane remained Chat.
- Source inspection confirms code paths for chat, settings, plugins, WWT controls, satellite controls, timeline state, and embedded browser preview.

Unverified runtime and integration behavior:

- Full automated Puppeteer verification, because `npm test` timed out before producing a fresh report.
- Screenshot evidence from the in-app Browser, because screenshot capture timed out.
- WebGL/Cesium globe rendering.
- WWT iframe runtime behavior.
- Timeline playback correctness.
- Satellite marker/trail/frustum visual correctness.
- Embedded browser allowed/blocked page behavior.
- Normal-browser chat submission and visible error handling beyond the reproduced Vite/in-app Browser failure.

User-impact risks requiring priority follow-up:

- Chat send currently creates data-loss perception in the tested Vite/in-app Browser path because submitted/error messages are not visible.
- Space can look active while the central spatial surface is absent or still showing Chat.
- Mobile workspace layout can block the central work surface.
- Spatial, satellite, telescope, and timeline controls may look functional before runtime behavior is proven.
- Telemetry and diagnostics may be mistaken for live data unless simulated/cached/live states are labeled.
- Connector settings may imply production sync or safe secret handling before backend/OAuth validation.
- Dense controls, custom cursor, animations, and iframe content remain unverified for keyboard-only users, screen-reader users, users sensitive to motion, and non-expert users.

Accessibility and usability areas not assessed:

- Keyboard-only navigation and focus order.
- Screen-reader clarity and ARIA semantics.
- Color contrast and readable failure messages.
- Reduced-motion and native-cursor comfort paths.
- Mobile, touch, low-bandwidth, and low-performance usability; a `390x844` mobile check already found the center pane collapsed.
- Non-expert discoverability and cognitive load.

Roadmap for upgrading provisional statuses:

1. Repair the automated test harness timeout and screenshot capture path.
2. Add visible, plain-language failure states for chat, WWT, timeline, satellites, embedded browser, and connectors.
3. Label live, simulated, static fallback, experimental, unavailable, and unverified states directly in UI copy.
4. Add fixture-backed tests for chat, Space, WWT, timeline, satellites, embedded browser, and settings.
5. Run keyboard, screen-reader/proxy, contrast, reduced-motion, mobile, and low-performance checks before claiming accessible readiness.

Readiness verdict: **provisional only**. The current evidence supports a useful capability audit and humane QA plan. It does not establish production readiness, accessibility readiness, or full user-trust readiness.
