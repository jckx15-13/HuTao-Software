import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

/** Which edge of the workspace the bar this button controls is docked to. */
export type PanelToggleSide = 'left' | 'right' | 'top';

export type PanelToggleButtonProps = {
  side: PanelToggleSide;
  /** True when the bar is expanded, so the arrow points at what the click does. */
  open: boolean;
  onToggle: () => void;
  /** Names the bar, e.g. "spatial sidebar". Used to build the accessible label. */
  label: string;
};

const ICON_BY_SIDE: Record<PanelToggleSide, Record<'open' | 'closed', typeof ChevronLeft>> = {
  left: { open: ChevronLeft, closed: ChevronRight },
  right: { open: ChevronRight, closed: ChevronLeft },
  top: { open: ChevronUp, closed: ChevronDown }
};

/**
 * The single collapse/expand control shared by every docked bar.
 *
 * Each bar previously rolled its own button and they had drifted apart — both
 * side panels used an h-4 icon while the header used h-3.5, at different corner
 * offsets — so the controls visibly failed to read as one set. Centralising the
 * box size, icon size and hit area here is what keeps them identical; a bar that
 * styles its own toggle puts itself back outside that guarantee.
 */
export function PanelToggleButton({ side, open, onToggle, label }: PanelToggleButtonProps) {
  const Icon = ICON_BY_SIDE[side][open ? 'open' : 'closed'];
  const action = open ? 'Collapse' : 'Expand';

  return (
    <button
      type="button"
      onClick={onToggle}
      title={`${action} ${label}`}
      aria-label={`${action} ${label}`}
      aria-expanded={open}
      className="panel-toggle-button flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/45 transition-colors duration-200 hover:border-white/25 hover:bg-black/60 hover:text-white cursor-pointer pointer-events-auto"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
