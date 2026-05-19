import { useRef, useState } from 'react';
import { Settings2, X } from 'lucide-react';
import { ThemeSettings } from './settings/ThemeSettings';
import { AiSettings } from './settings/AiSettings';
import { FeedbackSettings } from './settings/FeedbackSettings';
import { NotionSettings } from './settings/NotionSettings';

interface Point {
  x: number;
  y: number;
}

export function SettingsWindow({ onClose }: { onClose: () => void }) {
  const [position, setPosition] = useState<Point>({ x: 12, y: 72 });
  const dragStart = useRef<{ pointer: Point; origin: Point } | null>(null);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointer: { x: event.clientX, y: event.clientY },
      origin: position,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const nextX = dragStart.current.origin.x + event.clientX - dragStart.current.pointer.x;
    const nextY = dragStart.current.origin.y + event.clientY - dragStart.current.pointer.y;
    const panelWidth = Math.min(440, window.innerWidth - 24);
    setPosition({
      x: Math.max(12, Math.min(window.innerWidth - panelWidth - 12, nextX)),
      y: Math.max(64, Math.min(window.innerHeight - 160, nextY)),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section
      className="settings-window fixed left-0 top-0 z-[100] flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/55 shadow-[0_0_50px_rgba(0,0,0,0.5)] panel-glass backdrop-blur-2xl"
      style={{ left: position.x, top: position.y, width: 'min(440px, calc(100vw - 24px))' }}
      aria-label="System configuration"
    >
      <div
        className="flex h-14 shrink-0 cursor-grab items-center justify-between border-b border-white/5 px-6 active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex items-center gap-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          <Settings2 size={14} className="animate-spin-slow" />
          <span>System Config</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Close settings"
        >
          <X size={16} />
        </button>
      </div>

      <div className="scroller flex-1 space-y-10 overflow-y-auto p-8 pb-12">
        <ThemeSettings />
        <AiSettings />
        <FeedbackSettings />
        <NotionSettings />

        <div className="border-t border-white/5 pt-8">
          <div className="text-center font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
            Silver Wolf Protocol // v6.4.0-PRIME
          </div>
        </div>
      </div>
    </section>
  );
}
