/**
 * MODULE: ToggleSetting (Submodule of Settings)
 * 
 * PURPOSE:
 * A specialized version of a setting control that renders a sleek, animated iOS-style toggle switch.
 * 
 * WHY THIS METHOD WAS CHOSEN (CSS Checkbox Hack):
 * We use an actual `<input type="checkbox">` but visually hide it (`sr-only`), and style 
 * subsequent sibling `<div>`s based on the input's `:checked` pseudo-class (using Tailwind's `peer-checked`).
 * 
 * ALTERNATIVE:
 * Building a custom `div` that listens to `onClick` and manages its own internal state.
 * Why rejected? HTML `<input type="checkbox">` gives us keyboard accessibility (Tab focus, Space to toggle) 
 * and screen-reader compatibility for free. Reinventing that accessibility with `div`s requires
 * a lot of boilerplate ARIA attributes (`role="switch"`, `aria-checked`, `onKeyDown`).
 */
import type { LucideIcon } from 'lucide-react';

export interface ToggleSettingProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSetting({ icon: Icon, title, description, checked, onChange }: ToggleSettingProps) {
  return (
    // SYNTAX NOTE: `<label>` wrapper.
    // By wrapping everything in a `<label>`, clicking anywhere on the card will toggle the hidden checkbox.
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-panel-border/60 bg-panel/55 p-4 transition-colors hover:border-primary/40">
      <div className="flex min-w-0 items-center gap-4">
        <Icon className="h-5 w-5 shrink-0 text-text-muted" />
        <div className="min-w-0">
          <div className="font-mono text-sm tracking-wide text-text-main">{title}</div>
          <div className="mt-1 text-xs text-text-muted">{description}</div>
        </div>
      </div>
      <div className="relative">
        {/* The hidden actual input */}
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        {/* The switch background. `peer-checked:` applies styles when the sibling input is checked. */}
        <div className="h-6 w-11 rounded-full bg-panel-border/50 transition-colors peer-checked:bg-primary/60 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
        {/* The switch knob. `translate-x-5` moves it to the right when checked. */}
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-text-muted shadow transition-all peer-checked:translate-x-5 peer-checked:bg-white" />
      </div>
    </label>
  );
}
