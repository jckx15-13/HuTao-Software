import { ChatPanel } from '../ChatPanel';
import { SystemMonitor } from '../SystemMonitor';
import { LearningHub } from '../learning/LearningHub';
import { useUIStore } from '../../store/uiStore';
import { SessionSidebar } from './SessionSidebar';

export function DockedLayout() {
  const setShowSettings = useUIStore((s) => s.setShowSettings);
  const clearMessages = useUIStore((s) => s.clearMessages);
  const settingsDocked = useUIStore((s) => s.settingsDocked);
  const showSettings = useUIStore((s) => s.showSettings);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const rightPanelMode = useUIStore((s) => s.rightPanelMode);

  const hideSystemMonitor = showSettings && settingsDocked;

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <SessionSidebar
        onNewSession={clearMessages}
        onOpenSettings={() => setShowSettings(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative z-10 bg-transparent min-w-0">
        <div className="w-full h-full relative">
          <ChatPanel />
        </div>
      </main>

      {!hideSystemMonitor ? (
        <aside className="relative z-20 hidden w-80 shrink-0 flex-col border-l border-panel-border bg-panel panel-glass ambient-glow transition-opacity duration-300 xl:flex">
          {rightPanelMode === 'monitor' ? <SystemMonitor /> : <LearningHub />}
        </aside>
      ) : (
        <div className="hidden w-[400px] shrink-0 xl:block" />
      )}
    </div>
  );
}
