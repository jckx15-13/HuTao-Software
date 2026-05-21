import { ChevronRight } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export function SidebarTrigger() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);

  if (leftPanelOpen) return null;

  return (
    <button
      type="button"
      onClick={() => setLeftPanelOpen(true)}
      className="absolute top-1/2 left-0 -translate-y-1/2 z-20 flex h-14 w-5 items-center justify-center rounded-r-lg bg-black/40 hover:bg-black/60 border-y border-r border-white/10 hover:border-white/20 text-white/40 hover:text-white/80 transition-all cursor-pointer group shadow-lg"
      title="Expand Sidebar"
    >
      <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
