import { Cpu, Wifi, Battery, Menu, Bell, User } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export function WorkspaceHeader() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);
  const cpuLoad = useUIStore((s) => s.cpuLoad);
  const metrics = useUIStore((s) => s.systemMetrics);
  const setCurrentPage = useUIStore((s) => s.setCurrentPage);

  return (
    <header
      id="workspace-header"
      className="flex h-10 w-full items-center justify-between px-4 glass-panel-subtle border-b border-white/5"
      style={{ borderRadius: 0 }}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70 md:hidden"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          aria-label="Toggle navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <div className="relative h-1.5 w-1.5">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
            <div className="relative h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <span className="glow-text hidden sm:inline">Silver Wolf VI</span>
        </div>

        {/* System metrics */}
        <div className="hidden md:flex items-center gap-3 border-l border-white/5 pl-4 h-5">
          <Metric icon={Cpu} value={cpuLoad * 100} label="CPU" />
          <Metric icon={Wifi} value={metrics.networkLatency * 100} label="NET" />
          <Metric icon={Battery} value={metrics.batteryLevel * 100} label="PWR" />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('settings')}
          className="flex items-center gap-2 rounded-full p-1 pr-3 text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
          aria-label="User profile"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="hidden text-[10px] font-mono uppercase tracking-wider sm:inline">Operator</span>
        </button>
      </div>
    </header>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Cpu; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-mono">
      <Icon className="w-3 h-3" />
      <span className="w-6 text-right tabular-nums">{Math.round(value)}%</span>
      <span className="opacity-40">{label}</span>
    </div>
  );
}
