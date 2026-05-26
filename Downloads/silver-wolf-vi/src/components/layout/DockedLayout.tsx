import { ChatPanel } from '../ChatPanel';
import { SystemMonitor } from '../SystemMonitor';
import { useUIStore } from '../../store/uiStore';
import { SessionSidebar } from './SessionSidebar';

export function DockedLayout() {
  const { setShowSettings, clearMessages, settingsDocked, showSettings } = useUIStore();
  const hideSystemMonitor = showSettings && settingsDocked;

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      <SessionSidebar onNewSession={clearMessages} onOpenSettings={() => setShowSettings(true)} />

      <main className="flex-1 flex flex-col relative z-10 bg-transparent">
        <div className="w-full h-full relative">
          <ChatPanel />
        </div>
      </main>

      {!hideSystemMonitor ? (
        <aside className="relative z-20 hidden w-80 shrink-0 flex-col border-l border-panel-border bg-panel panel-glass ambient-glow transition-opacity duration-300 xl:flex">
          <SystemMonitor />
        </aside>
      ) : (
        <div className="hidden w-[400px] shrink-0 xl:block" />
      )}
    </div>
  );
}
