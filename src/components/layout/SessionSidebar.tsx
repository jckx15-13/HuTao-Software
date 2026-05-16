import { MessageSquare, Plus, Settings, Activity, GraduationCap } from 'lucide-react';
import { IconButton } from '../common/IconButton';
import { useUIStore } from '../../store/uiStore';

interface SessionSidebarProps {
  onNewSession: () => void;
  onOpenSettings: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function SessionSidebar({ onNewSession, onOpenSettings, isOpen = false, onClose }: SessionSidebarProps) {
  const { rightPanelMode, setRightPanelMode } = useUIStore();

  const handleNewSession = () => {
    onNewSession();
    onClose?.();
  };

  const handleOpenSettings = () => {
    onOpenSettings();
    onClose?.();
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex-col border-r border-panel-border bg-panel panel-glass ambient-glow
        transition-transform duration-300 ease-in-out
        md:relative md:z-20 md:translate-x-0 md:flex
        ${isOpen ? 'flex translate-x-0' : 'hidden -translate-x-full md:flex md:translate-x-0'}
      `}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <div className="flex flex-1 flex-col gap-3 p-4 pt-16 md:pt-4">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-primary/80">Workspace</div>
        <button
          id="new-chat-button"
          onClick={handleNewSession}
          className="flex w-full items-center gap-3 rounded-lg border border-primary/20 px-3 py-2.5 text-left text-sm text-text-main transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">New chat</span>
        </button>

        <div className="mt-6 px-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Views
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setRightPanelMode('monitor')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              rightPanelMode === 'monitor' 
                ? 'border border-primary/10 bg-panel-border/30 text-primary' 
                : 'text-text-muted hover:bg-white/5 hover:text-text-main'
            }`}
          >
            <Activity className="h-4 w-4 opacity-70" />
            <span>System Monitor</span>
          </button>
          <button
            onClick={() => setRightPanelMode('learning')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              rightPanelMode === 'learning' 
                ? 'border border-primary/10 bg-panel-border/30 text-primary' 
                : 'text-text-muted hover:bg-white/5 hover:text-text-main'
            }`}
          >
            <GraduationCap className="h-4 w-4 opacity-70" />
            <span>Learning Module</span>
          </button>
        </div>

        <div className="mt-6 px-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Sessions
        </div>
        <button
          className="flex w-full items-center gap-3 rounded-lg border border-primary/10 bg-panel-border/30 px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-primary/20"
        >
          <MessageSquare className="h-4 w-4 opacity-70" />
          <span className="truncate">Current chat</span>
        </button>
      </div>

      <div className="border-t border-panel-border bg-base/30 p-4">
        <IconButton
          icon={Settings}
          label="Settings"
          showLabel
          onClick={handleOpenSettings}
          className="w-full justify-start font-mono text-xs uppercase tracking-wider"
        />
      </div>
    </aside>
  );
}
