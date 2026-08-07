---
version: alpha
name: Silver Wolf VI Enterprise Spatial Console
description: >
  A pragmatic enterprise design system for dense operational workflows with high
  data density, predictable interactions, and explicit accessibility guardrails.
colors:
  primary: "#1C355A"
  on-primary: "#F8FAFF"
  primary-hover: "#2A4F87"
  secondary: "#A5B4C4"
  on-secondary: "#0B1522"
  accent: "#2D8FBE"
  accent-soft: "#CFE9F7"
  surface: "#0F172A"
  surface-strong: "#111A2C"
  surface-border: "#233453"
  background: "#090F1C"
  text-main: "#E7ECF3"
  text-muted: "#91A0B8"
  success: "#2EBA68"
  warning: "#EFB034"
  danger: "#E25757"
  danger-soft: "#F8C9C9"
typography:
  title:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
  heading:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 6px
  md: 10px
  lg: 14px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    padding: 12px 16px
    rounded: "{rounded.md}"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    padding: 10px 14px
    rounded: "{rounded.sm}"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-main}"
    padding: 10px 14px
    rounded: "{rounded.sm}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.md}"
  panel-strong:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.md}"
  status-pill:
    backgroundColor: "{colors.surface-border}"
    textColor: "{colors.text-muted}"
    padding: 4px 8px
    rounded: "{rounded.sm}"
  status-pill-accent:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.accent}"
    padding: 4px 8px
    rounded: "{rounded.sm}"
  status-pill-danger:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.danger}"
    padding: 4px 8px
    rounded: "{rounded.sm}"
  icon-button:
    size: 36
    backgroundColor: "rgba(11, 17, 34, 0.72)"
    textColor: "{colors.text-main}"
    rounded: "{rounded.sm}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  badge-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.surface-strong}"
    padding: 4px 8px
    rounded: "{rounded.sm}"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.background}"
    padding: 4px 8px
    rounded: "{rounded.sm}"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.background}"
    padding: 4px 8px
    rounded: "{rounded.sm}"
  badge-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.surface-strong}"
    padding: 4px 8px
    rounded: "{rounded.sm}"
---

## Overview

The enterprise interface should prioritize clear task progression over decorative motion.  
Panels must guide users to the next action, keep cognitive load low, and remain
stable under heavy operational use.

## Colors

The palette is contrast-forward and purpose-specific:

- `primary` for primary action and identity emphasis.
- `secondary` for neutral navigation and metadata emphasis.
- `accent` for progress, focus indicators, and status accents.
- `success`, `warning`, and `danger` reserved strictly for system state.

## Typography

Use predictable type scales with one primary face and limited weight spread.

- `title` for page and module headings.
- `heading` for section headers and toolbar labels.
- `body` for form fields, buttons, and panel text.
- `caption` for dense metadata and telemetry readouts.

## Layout

Keep hierarchy strict and discoverable:

- primary action groupings stay on the top edge in a single row when possible.
- progressive disclosure for advanced layers (telemetry, diagnostics, diagnostics settings).
- persistent task controls are never duplicated for the same action.
- critical map/navigation actions stay above overlays and never obstruct map controls.

## Elevation & Depth

- Use two elevation levels only: base panels and high-focus panels.
- Avoid layered “glass” stacking that blocks interaction targets.
- Reserve transparent overlays for non-operational context only.

## Shapes

- Use one radius scale: `sm`, `md`, and `lg`.
- Maintain consistent control sizes and icon-button dimensions across modules.

## Components

- Buttons should communicate one action with one visible label.
- Status pills should be muted by default, high contrast only when active.
- Panels should use semantic component classes, not ad-hoc variants per surface.

## Do's and Don'ts

### Do

- design from real workflow evidence and role-based task sequencing.
- preserve keyboard and screen-reader accessibility for every interactive control.
- keep live status visible but compact.
- make recovery and refresh actions explicit and singular.

### Don't

- overload a single panel with conflicting controls.
- place critical map controls behind telemetry or diagnostics overlays.
- duplicate controls for the same intent.
- rely on color alone to communicate severity.
