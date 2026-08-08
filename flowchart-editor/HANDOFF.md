# Flowchart Editor — Session Handoff

Resume point for the standalone flowchart editor + geography curriculum integration.

## Where things stand

**Project:** `/home/admin/Documents/flowchart-editor/` (Vite 8 + React 19 + TS 6 + Tailwind **v4** + Zustand + lucide-react)
**Dev server:** `npm run dev -- --port 3005 --host` → http://localhost:3005
**Approved plan:** `/home/admin/.claude/plans/composed-cooking-crayon.md`

### Done and verified
- Vite scaffold, deps installed, `npm run build` passed (before the Tailwind change).
- Google-Translate-style shell: `App.tsx` (left pane / right pane), `Header.tsx`, `CodeOutput.tsx`, `FlowchartCanvas.tsx`.
- Claude in Chrome **is working** — browser "Nyarch Chrome - Sakuyo", reached via
  `list_connected_browsers` → `switch_browser` (user clicks Connect in the extension popup).
  `select_browser` alone was NOT enough; `tabs_context_mcp` kept erroring until `switch_browser` ran.

### Done, NOT yet verified in browser
These landed but the page has not been reloaded/screenshotted since:
- **Tailwind v4 fix (the big one).** Tailwind was installed but never ran — v3 syntax
  (`@tailwind base/components/utilities` + `tailwind.config.js`) with no PostCSS config and no
  Vite plugin, so every utility class in the app was dead. Fixed by installing
  `@tailwindcss/vite`, adding it to `vite.config.ts` plugins, and switching `src/index.css` to
  `@import "tailwindcss";` + an `@theme {}` block.
- Removed dead scaffold CSS from `index.css` (h1/h2/code rules referencing undefined
  `--heading`, `--text-h`, `--code-bg`) and dropped the unused `./App.css` import from `App.tsx`.
- Added real `.glass-panel` / `.glow-cyan` definitions (they were referenced but never defined)
  plus a dark custom scrollbar.
- Refined `Header.tsx` (stacked labels, custom select chevron, hover-bg icon buttons),
  `CodeOutput.tsx` (line-number gutter, tooltip copy feedback instead of a layout-shifting
  banner), and `App.tsx` panel widths.
- `src/data/geographyCurriculum.ts` — **created**. ~140-node GCE O-Level Geography 2125 graph:
  3 topics (Tectonics / Everyday Life / Tourism), themes → outcomes → case studies, plus the
  learning-mode and AI-agent layer, and 5 deliberate cross-topic edges.

## Next steps, in order

1. **`src/utils/layout.ts` — not created yet.** Was mid-write when the session ended.
   Layered "Sugiyama-lite": rank by longest path from roots, order each rank by topic strand
   then parent barycentre, centre each rank, shift positive. Must tolerate **cycles** — the
   Case Study Curator edges point back at the topics, so no plain topological sort.
   Exports `layoutGraph(graph): {nodes, edges, bounds}` and `nodeSize(tier)`.

2. **Fix the real bug in `FlowchartCanvas.tsx`.** It styles nodes with
   `<style>{ '[key="..."] rect { fill: ... }' }</style>`. **`key` is a React-internal prop and
   never reaches the DOM**, so all node fill/stroke/hover styling has been silently no-op, and a
   fresh `<style>` tag is injected per node per render. Replace with real SVG `fill`/`stroke`
   props or CSS classes.

3. **Scale the canvas for ~140 nodes:** pan (drag background), zoom (wheel + buttons),
   fit-to-view, and viewport culling. Current canvas has a fixed viewport and only handles
   3 hardcoded nodes.

4. **Wire the curriculum in** — a "Load Geography Curriculum" action in `Header.tsx`, topic
   colours (tectonics rose / everyday sky / tourism emerald / system cyan).

5. **Verify in Chrome**: `switch_browser` → `navigate` http://localhost:3005 → screenshot.
   Confirm Tailwind is actually applying (selects should be dark and rounded, not OS-default).

## Carry-forward warnings

- **Curriculum content is my reconstruction, not the real SEAB syllabus.** Both earlier PDF
  downloads were Cambridge *website HTML*, not syllabus documents, and Cambridge publishes
  IGCSE — Singapore O-Level 2125 comes from **SEAB (seab.gov.sg)**. The outcomes in
  `geographyCurriculum.ts` are shaped correctly and fine for exercising the visualiser at scale,
  but must be replaced before generating anything students are assessed on. This is flagged in
  the file's header comment too.
- **GateGuard is the dominant cost driver.** Every first write to a new file and first Bash call
  demands a facts preamble, roughly doubling token cost per file. `~/.claude/settings.local.json`
  already has `ECC_DISABLED_HOOKS` set, but it is **not taking effect** — the gate fired ~11
  times this session. Launching with `ECC_GATEGUARD=off` in the environment is the reliable fix
  and is worth doing before the next build session.
- The old study-app dev server may still hold port 3000; flowchart-editor uses 3005.
