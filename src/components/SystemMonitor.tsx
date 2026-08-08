/**
 * MODULE: System Layout
 * PANES: DASHBOARD (Brainstem)
 * 
 * Clinical, radar-style dashboard tracking telemetry, Odysseus Hardware Bridge status,
 * orbital satellite tracking, and no-auth system persistence with 2.5D constraints.
 */
import { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { Activity, Brain, ShieldCheck, Zap, AlertTriangle, Satellite, Cpu, Radio, Database, Server, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useIdleTask } from '../hooks/useIdleTask';
import { useOdysseusBridge } from '../hooks/useOdysseusBridge';
import { getTelemetryLogs, SYSTEM_OPERATOR_ID } from '../lib/jsonStorage';

const SvgRing = ({ value, color, label }: { value: number; color: string; label: string }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(1, Math.max(0, value)) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[10px] font-mono font-bold tracking-widest relative z-content text-cyan-300 drop-shadow-md">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">{label}</span>
    </div>
  );
};

export function SystemMonitor() {
  const { systemMetrics, cpuLoad, setCpuLoad, updateSystemMetrics } = useUIStore();
  const { status: odysseusStatus } = useOdysseusBridge();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    try {
      const logs = getTelemetryLogs();
      setLogCount(logs.length);
    } catch (e) {
      // safe fallback
    }
  }, []);

  useIdleTask(
    () => {
      const volatility = cpuLoad > 0.8 ? 0.1 : 0.02;
      const currentMetrics = useUIStore.getState().systemMetrics;
      updateSystemMetrics({
        ramUsage: clampMetric(currentMetrics.ramUsage + (Math.random() * volatility * 2 - volatility)),
        networkLatency: clampMetric(currentMetrics.networkLatency + (Math.random() * volatility * 2 - volatility)),
        storageUsage: clampMetric(currentMetrics.storageUsage + (Math.random() * 0.03 - 0.015)),
        batteryLevel: clampMetric(currentMetrics.batteryLevel + (Math.random() * 0.05 - 0.025)),
      });
      setLastUpdated(new Date());
    },
    cpuLoad > 0.8 ? 500 : 2000,
  );

  return (
    <div className="flex flex-col h-full w-full p-6 relative font-mono overflow-y-auto scroller bg-slate-950/80 text-slate-200">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-6">
        <div className="flex items-center gap-2.5 text-cyan-400">
          <Brain className="w-4 h-4 animate-pulse" />
          <span className="text-[11px] uppercase font-bold tracking-[0.2em] text-cyan-300">
            SYSTEM // DASHBOARD
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-wider">
            {SYSTEM_OPERATOR_ID}
          </span>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        </div>
      </div>

      {/* Odysseus Hardware Bridge Panel */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${odysseusStatus.online ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
              Odysseus Bridge
            </span>
          </div>
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
              odysseusStatus.online
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
            }`}
          >
            {odysseusStatus.online ? 'PORT 8001 ONLINE' : 'STANDBY'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>LLM: {odysseusStatus.modelName.split('/').pop()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Database className="w-3 h-3 text-violet-400" />
            <span>JSON Logs: {logCount}</span>
          </div>
        </div>
      </div>

      {/* SVG Rings: RAM & Network */}
      <div className="flex justify-around items-center mb-6 bg-slate-900/40 backdrop-blur-md rounded-xl p-4 border border-cyan-500/15 shadow-inner">
        <SvgRing value={systemMetrics.ramUsage} color="#06b6d4" label="RAM Load" />
        <SvgRing value={systemMetrics.networkLatency} color="#10b981" label="Network Latency" />
      </div>

      {/* CPU Load Controls (2.5D Style) */}
      <div className="mb-6 p-4 bg-slate-900/50 backdrop-blur-md rounded-xl relative overflow-hidden group border border-cyan-500/20 transition-all hover:border-cyan-500/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-cyan-400" /> CPU Load Dynamics
          </span>
          <AlertTriangle className={`w-4 h-4 ${cpuLoad > 0.8 ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
        </div>
        <input
          id="cpu-load-slider"
          name="cpu-load-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={cpuLoad}
          onChange={(e) => setCpuLoad(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-[8px] text-slate-400 mt-2 uppercase tracking-widest font-semibold">
          <span>Idle</span>
          <span className="text-cyan-300 font-mono">{(cpuLoad * 100).toFixed(0)}%</span>
          <span>Max Compute</span>
        </div>
      </div>

      {/* Telemetry Readouts */}
      <div className="space-y-4 mb-6">
        <TelemetryRow label="Storage Usage" value={systemMetrics.storageUsage} icon={Activity} color="#38bdf8" />
        <TelemetryRow label="Battery Level" value={systemMetrics.batteryLevel} icon={Zap} color="#f59e0b" />
        <SatcomTelemetry />
        <TelemetryRow label="System Shield" value={1.0} icon={ShieldCheck} color="#a855f7" isStatic />
      </div>

      {/* Forensic Marginalia */}
      <div className="mt-auto pt-4 flex flex-col gap-1 text-[9px] text-slate-500 border-t border-cyan-500/20">
        <div className="flex justify-between items-center">
          <span className="tracking-[0.2em] uppercase text-cyan-400 font-bold">STATE: LOCAL OPERATOR</span>
          <span className="tracking-[0.1em] font-mono text-slate-400">{lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

function SatcomTelemetry() {
  const satelliteData = useUIStore((s) => s.satelliteData);
  const activeTracks = Math.max(1, Object.keys(satelliteData).length);

  return (
    <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-slate-800/40 transition-colors">
      <div className="flex items-center gap-2">
        <Satellite className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
        <span className="text-[10px] tracking-widest text-slate-300 font-semibold uppercase">ISS & Satcom Uplink</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
          {activeTracks} ACTIVE
        </span>
      </div>
    </div>
  );
}

function clampMetric(value: number) {
  return Math.max(0, Math.min(1, value));
}

function TelemetryRow({
  label,
  value,
  icon: Icon,
  color = '#38bdf8',
  isStatic = false,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  isStatic?: boolean;
}) {
  return (
    <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-slate-800/40 transition-colors">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-colors" />
        <span className="text-[10px] tracking-widest text-slate-300 font-semibold uppercase">{label}</span>
      </div>
      {!isStatic ? (
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-slate-800 rounded-full relative overflow-hidden border border-slate-700">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
              transition={{ type: 'spring', bounce: 0, damping: 20 }}
            />
          </div>
          <span className="text-[10px] w-8 text-right font-mono text-cyan-300 font-bold">
            {(value * 100).toFixed(0)}%
          </span>
        </div>
      ) : (
        <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
          NOMINAL
        </span>
      )}
    </div>
  );
}
