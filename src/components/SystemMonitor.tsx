/**
 * MODULE: System Layout
 * PANES: DASHBOARD (Brainstem)
 * 
 * Clinical, radar-style dashboard tracking telemetry with 2.5D constraints.
 */
import { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { Activity, Brain, ShieldCheck, Zap, AlertTriangle, type LucideIcon } from 'lucide-react';
import { useIdleTask } from '../hooks/useIdleTask';

const SvgRing = ({ value, color, label }: { value: number, color: string, label: string }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - value * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r={radius} fill="transparent" stroke="var(--theme-bg-panel-border)" strokeWidth="4" />
          <circle
            cx="40" cy="40" r={radius} 
            fill="transparent" stroke={color} strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[10px] font-mono font-bold tracking-widest relative z-10 text-white shadow-black drop-shadow-md">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <span className="text-[9px] uppercase tracking-widest text-text-muted">{label}</span>
    </div>
  );
};

export function SystemMonitor() {
  const { systemMetrics, cpuLoad, setCpuLoad, updateSystemMetrics } = useUIStore();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useIdleTask(
    () => {
      const volatility = cpuLoad > 0.8 ? 0.1 : 0.02;
      const currentMetrics = useUIStore.getState().systemMetrics || {
        ramUsage: 0.35,
        networkLatency: 0.6,
        storageUsage: 0.45,
        batteryLevel: 0.9,
      };
      updateSystemMetrics({
        ramUsage: clampMetric(currentMetrics.ramUsage + (Math.random() * volatility * 2 - volatility)),
        networkLatency: clampMetric(currentMetrics.networkLatency + (Math.random() * volatility * 2 - volatility)),
        storageUsage: clampMetric(currentMetrics.storageUsage + (Math.random() * 0.03 - 0.015)),
        batteryLevel: clampMetric(currentMetrics.batteryLevel + (Math.random() * 0.05 - 0.025)),
      });
      setLastUpdated(new Date());
    },
    [cpuLoad, updateSystemMetrics],
    cpuLoad > 0.8 ? 500 : 2000,
  );

  return (
    <div className="flex flex-col h-full w-full p-6 relative font-mono overflow-y-auto scroller">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-primary/30 pb-2 mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Brain className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">SYSTEM // DASHBOARD</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <div className={`w-1.5 h-1.5 rounded-full ${cpuLoad > 0.8 ? 'bg-danger' : 'bg-primary/30'}`} />
        </div>
      </div>

      {/* SVG Rings: RAM & Network */}
      <div className="flex justify-around items-center mb-8 bg-base/30 backdrop-blur-md rounded-lg p-4 shadow-[inset_0_4px_20px_rgba(0,0,0,0.3)] border border-primary/10 relative z-10">
        <SvgRing value={systemMetrics.ramUsage} color="var(--theme-accent-triad-1)" label="RAM" />
        <SvgRing value={systemMetrics.networkLatency} color="var(--theme-accent-phi-1)" label="Network" />
      </div>

      {/* CPU Load Controls (2.5D Style) */}
      <div className="mb-8 p-4 bg-base/30 backdrop-blur-md shadow-[var(--shadow-2-5d)] rounded-lg relative overflow-hidden group border border-primary/10 transition-shadow hover:shadow-[var(--shadow-2-5d-hover)]">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <h4 className="text-[9px] uppercase tracking-widest text-text-muted mb-3 flex items-center justify-between">
          <span>CPU Load</span>
          <AlertTriangle className={`w-4 h-4 ${cpuLoad > 0.8 ? 'text-danger animate-[pulse_0.4s_infinite]' : 'text-primary/50'}`} />
        </h4>
        <input 
          type="range" 
          min="0" max="1" step="0.01" 
          value={cpuLoad}
          onChange={(e) => setCpuLoad(Number(e.target.value))}
          className="w-full h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: cpuLoad > 0.8 ? 'var(--theme-danger)' : 'var(--theme-primary)' }}
        />
        <div className="flex justify-between text-[8px] text-text-muted mt-2 uppercase tracking-widest">
          <span>Idle</span>
          <span>Max</span>
        </div>
      </div>

      {/* Telemetry Readouts */}
      <div className="space-y-6">
        <TelemetryRow label="Storage Usage" value={systemMetrics.storageUsage} icon={Activity} color="var(--theme-accent-triad-2)" />
        <TelemetryRow label="Battery Level" value={systemMetrics.batteryLevel} icon={Zap} color="var(--theme-accent-phi-2)" />
        <TelemetryRow label="System Shield" value={1.0} icon={ShieldCheck} color="var(--theme-accent-comp)" isStatic />
      </div>
      
      {/* Forensic Marginalia */}
      <div className="mt-auto pt-6 flex flex-col gap-1 text-[8px] text-text-muted/50 border-t border-primary/20 relative z-10">
        <span className="tracking-[0.3em]">STATE: LOCAL SESSION</span>
        <span className="tracking-[0.3em]">UPDATED: {lastUpdated.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

function clampMetric(value: number) {
  return Math.max(0, Math.min(1, value));
}

function TelemetryRow({ label, value, icon: Icon, color = "var(--theme-primary)", isStatic = false }: { label: string, value: number, icon: LucideIcon, color?: string, isStatic?: boolean }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
        <span className="text-[10px] tracking-widest text-text-muted group-hover:text-white transition-colors uppercase">{label}</span>
      </div>
      {!isStatic ? (
        <div className="flex items-center gap-3">
          <div className="w-16 h-1.5 bg-base rounded-full relative overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
            <div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ backgroundColor: color, width: `${value * 100}%` }}
            />
          </div>
          <span className="text-[10px] w-8 text-right font-mono text-white text-shadow-sm">{(value * 100).toFixed(0)}</span>
        </div>
      ) : (
        <span className="text-[10px] tracking-widest drop-shadow-[0_0_5px_currentColor]" style={{ color }}>NOMINAL</span>
      )}
    </div>
  );
}
