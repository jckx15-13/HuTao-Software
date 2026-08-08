import { Cpu, Wifi, Battery, Menu, Bell, User, PanelRight, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export function WorkspaceHeader() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const cpuLoad = useUIStore((s) => s.cpuLoad);
  const metrics = useUIStore((s) => s.systemMetrics);
  const setCurrentPage = useUIStore((s) => s.setCurrentPage);
  const topBarOpen = useUIStore((s) => s.topBarOpen);
  const setTopBarOpen = useUIStore((s) => s.setTopBarOpen);
  const modeSwitcherOpen = useUIStore((s) => s.modeSwitcherOpen);
  const setModeSwitcherOpen = useUIStore((s) => s.setModeSwitcherOpen);

  if (!topBarOpen) {
    return (
      <div
        id="workspace-header"
        className="relative z-chrome flex w-full justify-center pointer-events-none pt-2 pb-1 transition-all duration-300 shrink-0"
      >
        <button
          type="button"
          onClick={() => setTopBarOpen(true)}
          aria-label="Show top bar (Alt+T)"
          aria-expanded="false"
          title="Show top bar (Alt+T)"
          className="group pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#06070a]/80 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:bg-black/90 hover:text-white hover:shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)] cursor-pointer"
        >
          <div className="relative h-1.5 w-1.5 shrink-0">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60 group-hover:opacity-100" />
            <div className="relative h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <span className="glow-text">Show Header</span>
          <span className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-normal text-white/50 group-hover:text-white/80 min-[640px]:inline">
            Alt+T
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-white/50 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:text-primary" />
        </button>
      </div>
    );
  }

  return (
    <header
      id="workspace-header"
      aria-expanded="true"
      className="flex h-14 w-full items-center justify-between px-4 glass-panel-subtle border-b border-white/5 pointer-events-auto z-chrome shrink-0 transition-all duration-300"
      style={{ borderRadius: 0 }}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70 min-[760px]:hidden cursor-pointer"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          aria-label="Toggle navigation"
          title="Toggle left panel"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <div className="relative h-1.5 w-1.5">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
            <div className="relative h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <span className="glow-text inline">Silver Wolf VI</span>
        </div>

        <button
          type="button"
          onClick={() => setModeSwitcherOpen(!modeSwitcherOpen)}
          className={`mode-header-toggle inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border px-2 text-white/45 transition-all hover:text-white/85 ${modeSwitcherOpen ? 'is-active' : ''}`}
          aria-label={modeSwitcherOpen ? 'Hide workspace modes' : 'Show workspace modes'}
          aria-pressed={modeSwitcherOpen}
          title={modeSwitcherOpen ? 'Hide workspace modes' : 'Show workspace modes'}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden text-[9px] font-bold uppercase tracking-wider min-[760px]:inline">Modes</span>
        </button>

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
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70 min-[760px]:hidden cursor-pointer"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          aria-label="Toggle details panel"
          title="Toggle right panel"
        >
          <PanelRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60 sm:min-h-11 sm:min-w-11 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('settings')}
          className="flex min-h-10 items-center gap-1.5 rounded-full p-1 pr-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/60 sm:min-h-11 sm:gap-2 sm:pr-3 cursor-pointer"
          aria-label="User profile"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 sm:h-6 sm:w-6">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="hidden text-[10px] font-mono uppercase tracking-wider md:inline">Operator</span>
        </button>

        <button
          type="button"
          onClick={() => setTopBarOpen(false)}
          className="group inline-flex min-h-10 min-w-10 items-center justify-center rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white sm:min-h-11 sm:min-w-11 cursor-pointer"
          aria-label="Hide top bar (Alt+T)"
          title="Hide top bar (Alt+T)"
        >
          <ChevronDown className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-primary" />
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
