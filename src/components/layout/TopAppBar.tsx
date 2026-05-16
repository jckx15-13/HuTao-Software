import { Settings, Cpu, Wifi, Battery } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { IconButton } from '../common/IconButton';

export function TopAppBar() {
  const showSettings = useUIStore((s) => s.showSettings);
  const setShowSettings = useUIStore((s) => s.setShowSettings);
  const cpuLoad = useUIStore((s) => s.cpuLoad);
  const metrics = useUIStore((s) => s.systemMetrics);

  return (
    <header
      id="top-app-bar"
      className="fixed left-0 top-0 z-50 flex h-14 w-full items-center justify-between px-6 bg-black/20 backdrop-blur-md border-b border-white/5"
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 font-mono text-xs font-black uppercase tracking-[0.3em] text-primary glow-text">
          <div className="relative h-2 w-2">
            <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
            <div className="relative h-2 w-2 rounded-full bg-primary" />
          </div>
          <span>Silver Wolf VI</span>
        </div>

        <div className="hidden md:flex items-center gap-4 border-l border-white/10 pl-6 h-6">
          <Metric icon={Cpu} value={cpuLoad * 100} label="CPU" />
          <Metric icon={Wifi} value={metrics.networkLatency * 100} label="NET" />
          <Metric icon={Battery} value={metrics.batteryLevel * 100} label="PWR" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <IconButton
          icon={Settings}
          label="Configuration"
          onClick={() => setShowSettings(!showSettings)}
          className={showSettings ? 'text-primary' : ''}
        />
      </div>
    </header>
  );
}

function Metric({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
      <Icon className="w-3 h-3" />
      <span className="w-8 text-right">{Math.round(value)}%</span>
      <span className="opacity-50">{label}</span>
    </div>
  );
}
