/**
 * MODULE: SettingCard (Submodule of Settings)
 * 
 * PURPOSE:
 * A reusable container component for individual setting items. It enforces a consistent
 * layout (Icon + Title/Description on the left, Control element on the right).
 * 
 * WHY THIS METHOD WAS CHOSEN (Composition vs Props):
 * Notice we accept `children: ReactNode` for the right-side control.
 * 
 * ALTERNATIVE:
 * `function SettingCard({ type: 'toggle' | 'select', ... }) { ... }`
 * Why rejected? Passing a type and having the card render the control internally creates a 
 * "God Component" that has to know about every possible input type.
 * By using React Composition (`children`), the `SettingCard` only cares about LAYOUT,
 * and the parent provides the CONTROL. This makes it infinitely extensible.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SettingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

export function SettingCard({ icon: Icon, title, description, children }: SettingCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-panel-border/60 bg-panel/55 p-4 transition-colors hover:border-primary/40">
      <div className="flex min-w-0 items-center gap-4">
        {/* 
          SYNTAX NOTE: `icon: Icon` in props. 
          We alias `icon` to `Icon` (capitalized) so React treats it as a Component,
          allowing us to render it as `<Icon />`. If it were lowercase `<icon />`, 
          React would think it's a native HTML tag (which is invalid).
        */}
        <Icon className="h-5 w-5 shrink-0 text-text-muted" />
        <div className="min-w-0">
          <div className="font-mono text-sm tracking-wide text-text-main">{title}</div>
          <div className="mt-1 text-xs text-text-muted">{description}</div>
        </div>
      </div>
      {/* Render the injected control here */}
      <div className="shrink-0">{children}</div>
    </div>
  );
}
