---
title: Silver Wolf VI design system
status: Current implementation reference
last-reviewed: 2026-10-26
scope: Silver Wolf VI desktop and responsive workspace
---

# Silver Wolf VI design system

This document is the entry point for design decisions in the Silver Wolf VI application. It describes the implemented theme system and the principles that should guide new interface work. The product is a dense chat and spatial workspace; operational clarity, trustworthy system state, and reachable controls take priority over decoration.

## Source of truth

Use these sources in this order when they disagree:

1. Current behavior and tokens in `src/index.css`, `src/lib/themeEngine.ts`, and `src/hooks/useThemeVariables.ts`.
2. This document for shared design principles and intended behavior.
3. `design-tokens.tailwind.json` only for utility-class tokens that are intentionally consumed by Tailwind.
4. `docs/SilverWolf_Theme_Engine.md` for background and future theming proposals. It is not a specification for features that are not implemented.

The current default visual direction is a dark, purple-and-cyan workspace with translucent panels, Inter interface typography, and monospace technical values. The runtime theme engine also provides multiple named palettes and wallpaper-derived themes. The static blue enterprise palette in `design-tokens.tailwind.json` is not the runtime default; do not use it to retheme the product without an explicit product decision.

## Product and user needs

The interface brings chat, settings, diagnostics, and a spatial globe/telescope workspace together. Users need to:

- understand which workspace or mode is active;
- find the next task action without competing overlays;
- tell live, simulated, unavailable, and unverified data apart;
- recover from offline bridges, missing credentials, blocked embeds, and empty data;
- use core controls at narrow widths and with keyboard focus.

## Visual language

### Color and theme roles

Theme palettes are defined in `src/lib/themeEngine.ts` and applied as CSS variables. Use semantic roles rather than hard-coded palette values in components:

| Role | Intended use |
| --- | --- |
| Base background | Workspace and canvas foundation |
| Panel surface and border | Chat, settings, side panels, and dialogs |
| Primary | Main action and selected emphasis |
| Secondary | Supporting emphasis and space-mode distinction |
| Main and muted text | Content first; supporting labels second |
| Success, warning, danger | System state only, never decoration |

The default palette uses a near-black base, purple primary, cyan secondary, pale main text, and muted slate labels. Other palettes may change those values, but must preserve semantic meaning and readable contrast. Do not rely on color alone to communicate a state.

### Typography

- Use Inter (with system sans-serif fallbacks) for interface copy, headings, and controls.
- Use JetBrains Mono or the configured monospace fallback for coordinates, timestamps, code, and telemetry values.
- Establish hierarchy through size, weight, and spacing. Keep dense metadata readable and avoid making all labels uppercase or monospace.
- Use the shared type scale and theme variables where available; set control typography deliberately rather than relying on browser defaults.

### Surfaces and layout

- Keep the globe or primary work surface visually dominant. Panels should provide usable contrast without obscuring important map controls.
- Use translucent/blurred surfaces as a theme treatment, not as a reason to stack many overlapping panels. Provide a more opaque fallback where blur is unavailable or expensive.
- Use the existing radius, spacing, and elevation variables. Keep elevation restrained and distinguish the persistent shell from transient popovers.
- At narrow widths, prioritize the active task and collapse or move secondary panels instead of squeezing every desktop panel into the viewport.
- Keep persistent controls singular. Use progressive disclosure for diagnostics and advanced configuration.

## Interaction and state

- Every visible control needs a clear name, an understandable focus state, and a meaningful response.
- Show pending, success, empty, offline, error, and degraded states in the interface where the user needs to recover. Do not imply simulated telemetry or unverified integrations are live.
- Preserve user input when a send or save action fails, and explain a recovery step in plain language.
- Respect `prefers-reduced-motion` and the user's motion preference. Motion and sound are optional feedback, not the only signal that an action occurred.
- Use accessible labels for icon-only controls and keyboard-operable patterns for menus, dialogs, tabs, and panels.

## Responsive and accessibility baseline

- Keep primary actions and navigation available at mobile widths; prevent side panels from covering the central workspace or each other.
- Verify text reflow, focus visibility, keyboard order, and contrast for each palette and interactive state.
- Treat WCAG contrast calculations as a check on specific text/background pairs, not proof of overall accessibility.
- Do not claim accessibility certification from source review or screenshots alone. See the current evidence and gaps in `docs/manual/Operator-Manual.md`.

## Design review checklist

Before merging a UI change, confirm:

1. The active task and primary action are apparent.
2. New colors use semantic theme roles and remain legible in supported palettes.
3. Live, simulated, unavailable, and experimental states are labeled honestly.
4. Panels preserve map visibility and do not hide critical controls.
5. Controls work with keyboard input and expose visible focus and accessible names.
6. Narrow layouts keep essential controls reachable without overlap or horizontal overflow.
7. Motion and sound respect user preferences and reduced-motion settings.
8. Screenshots and runtime checks support any claims made about the changed flow.

## Related design documents

| Document | Status | Use |
| --- | --- | --- |
| `docs/SilverWolf_Theme_Engine.md` | Proposal/background; partially implemented | Palette extraction and future theme ideas |
| `docs/manual/Operator-Manual.md` | Provisional capability and UX audit | Evidence-backed behavior gaps and validation status |
| `design-tokens.tailwind.json` | Utility token file; currently divergent | Tailwind classes that explicitly consume these values |
| `../world-wide-view/worldwideview/DESIGN.md` | Separate product design system | WorldWideView standalone application only |
| `../world-wide-view/worldwideview/docs/superpowers/specs/2026-06-13-tactical-theme-design.md` | Product-specific theme proposal | Proposed Tactical theme for standalone WorldWideView; not a Silver Wolf VI default |

## Known documentation gap

The Tailwind utility palette currently describes a blue enterprise scheme while runtime CSS and the theme engine use the purple/cyan visual system. Until these are reconciled in code, treat runtime theme definitions as authoritative and avoid assuming Tailwind color utilities match the active application theme. A future code change should either map Tailwind utilities to semantic runtime variables or remove the unused palette after checking consumers.
