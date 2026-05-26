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
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-panel-border bg-panel-border/20 px-4">
      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary">
        <TerminalSquare className="h-4 w-4" />
        <span>Chat</span>
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
