/**
 * MODULE: PaletteOption (Submodule of Settings)
 * 
 * PURPOSE:
 * Renders a selectable button representing a specific color theme. 
 * Shows a preview of the main colors in that theme.
 */
import { Palette } from 'lucide-react';
import { formatPaletteName, palettes, type PaletteKey, type ThemeVars } from '../../lib/themeEngine';
import { useUIStore } from '../../store/uiStore';

// We extract the swatch tokens to keep the component body clean.
const paletteSwatches: Array<keyof ThemeVars> = [
  '--theme-bg-base',
  '--theme-primary',
  '--theme-accent-triad-1',
  '--theme-accent-triad-2',
  '--theme-accent-phi-1',
  '--theme-accent-phi-2',
];

export function PaletteOption({ paletteKey }: { paletteKey: PaletteKey }) {
  // We subscribe only to `activePalette` and `setActivePalette`.
  const activePalette = useUIStore((state) => state.activePalette);
  const setActivePalette = useUIStore((state) => state.setActivePalette);
  
  const palette = palettes[paletteKey];
  const isActive = activePalette === paletteKey;

  return (
    <button
      onClick={() => setActivePalette(paletteKey)}
      // SYNTAX NOTE: Conditional Template Literal
      // We conditionally inject CSS classes based on `isActive`.
      className={`flex items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors ${
        isActive
          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_color-mix(in_srgb,var(--theme-primary)_14%,transparent)]'
          : 'border-panel-border/60 bg-panel/55 text-text-muted hover:border-primary/40'
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Palette className="h-5 w-5 shrink-0" style={{ color: palette['--theme-primary'] }} />
        <span className="truncate font-mono text-sm tracking-wide">{formatPaletteName(paletteKey)}</span>
      </div>
      <div className="flex max-w-[92px] flex-wrap justify-end gap-1.5">
        {paletteSwatches.map((token) => (
          <span
            key={token}
            className="h-3 w-3 rounded-full border border-black/20"
            style={{ background: palette[token] }}
            // Tooltip shows the color variable name without the `--theme-` prefix
            title={token.replace('--theme-', '')}
          />
        ))}
      </div>
    </button>
  );
}
