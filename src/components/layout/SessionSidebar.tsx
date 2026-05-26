import { MessageSquare, Plus, Settings } from 'lucide-react';
import { IconButton } from '../common/IconButton';

interface SessionSidebarProps {
  onNewSession: () => void;
  onOpenSettings: () => void;
}

export function SessionSidebar({ onNewSession, onOpenSettings }: SessionSidebarProps) {
  return (
    <aside className="relative z-20 hidden w-64 shrink-0 flex-col border-r border-panel-border bg-panel panel-glass ambient-glow md:flex">
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-primary/80">Workspace</div>
        <button
          onClick={onNewSession}
          className="flex w-full items-center gap-3 rounded-lg border border-primary/20 px-3 py-2.5 text-left text-sm text-text-main transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">New chat</span>
        </button>

        <div className="mt-6 px-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Sessions
        </div>
        <button
          onClick={onNewSession}
          className="mt-2 flex w-full items-center gap-3 rounded-lg border border-primary/10 bg-panel-border/30 px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-primary/20"
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
          onClick={onOpenSettings}
          className="w-full justify-start font-mono text-xs uppercase tracking-wider"
        />
      </div>
    </aside>
  );
}
