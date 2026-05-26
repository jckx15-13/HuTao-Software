import { CenterPanel } from '../panels/CenterPanel';
import { LeftPanel } from '../panels/LeftPanel';
import { RightPanel } from '../panels/RightPanel';
import { SystemMonitor } from '../SystemMonitor';
import { useUIStore } from '../../store/uiStore';

export function DockedLayout() {
  const { setShowSettings, settingsDocked, showSettings, rightPanelOpen } = useUIStore();
  const hideSystemMonitor = showSettings && settingsDocked;

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      <LeftPanel />

      <main className="flex-1 flex flex-col relative z-10 bg-transparent pointer-events-none">
        <div className="w-full h-full relative pointer-events-none">
          <CenterPanel />
        </div>
      </main>

      {rightPanelOpen ? (
        <RightPanel />
      ) : !hideSystemMonitor ? (
        <aside className="relative z-20 hidden w-80 shrink-0 flex-col border-l border-panel-border bg-panel panel-glass ambient-glow transition-opacity duration-300 xl:flex">
          <SystemMonitor />
        </aside>
      ) : (
        <div className="hidden w-[400px] shrink-0 xl:block" />
      )}
    </div>
  );
}
