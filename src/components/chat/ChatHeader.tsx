import { Maximize2, TerminalSquare, Trash2 } from 'lucide-react';
import { IconButton } from '../common/IconButton';

interface ChatHeaderProps {
  onClear: () => void;
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    return;
  }

  await document.exitFullscreen();
}

export function ChatHeader({ onClear }: ChatHeaderProps) {
  return (
    <header className="panel-glass relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-primary/15 bg-gradient-to-r from-panel/85 via-panel/65 to-background/30 px-5 shadow-[0_12px_30px_color-mix(in_srgb,var(--theme-primary)_8%,transparent)]">
      <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest text-primary">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10 shadow-[0_0_18px_color-mix(in_srgb,var(--theme-primary)_18%,transparent)]">
          <TerminalSquare className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span>Chat</span>
          <span className="mt-1 text-[11px] font-medium tracking-[0.14em] text-text-muted/70">AI workspace</span>
        </div>
      </div>

      <div className="flex gap-2">
        <IconButton
          icon={Maximize2}
          label="Toggle fullscreen"
          onClick={() => toggleFullscreen().catch(() => undefined)}
        />
        <IconButton icon={Trash2} label="Clear chat" onClick={onClear} variant="danger" />
      </div>
    </header>
  );
}
