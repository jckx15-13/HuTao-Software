/**
 * MODULE: Synaptic Flow
 * FEATURE: Neural Ingestion Monitor
 * 
 * PURPOSE:
 * A "Data Stream" visualization that monitors the ingestion of new concepts.
 * This module leverages real-time system metrics:
 * 1. CPU LOAD: Drives the speed of the synaptic scrolling lattice.
 * 2. RAM USAGE: Controls the "Buffer Saturation" visual indicator.
 * 3. NETWORK LATENCY: Affects the "Signal Integrity" (glitch frequency).
 */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLearningStore } from '../../store/learningStore';
import { useUIStore } from '../../store/uiStore';
import { Zap, Database, ShieldAlert, Cpu } from 'lucide-react';

export function SynapticFlow() {
  const { concepts } = useLearningStore();
  const { cpuLoad, systemMetrics } = useUIStore();

  // Filter for the new cybernetic concepts we just added to show "Recent Ingestions"
  const recentConcepts = useMemo(() => {
    return concepts.filter(c => c.id.startsWith('cyb-')).slice(-10);
  }, [concepts]);

  // Derived metrics for UI logic
  const scrollSpeed = 5 + (cpuLoad * 20); // Pixels per second or similar transition timing
  const bufferLevel = systemMetrics.ramUsage * 100;
  const signalGlitch = systemMetrics.networkLatency > 0.7;

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-black/60 backdrop-blur-2xl border border-accent-phi-1/30 rounded-xl p-5 font-mono group">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--theme-accent-phi-1) 1px, transparent 1px), linear-gradient(90deg, var(--theme-accent-phi-1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          transform: `translateY(${(Date.now() / 100) % 30}px)`
        }}
      />

      {/* Header HUD */}
      <div className="flex justify-between items-start mb-6 z-10">
        <div>
          <h2 className="text-accent-phi-1 font-bold text-xs tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 fill-accent-phi-1" />
            SYNAPTIC_STREAM // ACTIVE
          </h2>
          <p className="text-[9px] text-text-muted mt-1 uppercase">Hardware-Linked Neural Ingestion</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-primary font-bold">BUFFER_STAT: {bufferLevel.toFixed(1)}%</div>
          <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
            <motion.div 
              className="h-full bg-primary shadow-[0_0_8px_var(--theme-primary)]"
              animate={{ width: `${bufferLevel}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
        </div>
      </div>

      {/* Data Stream */}
      <div className="flex-1 relative overflow-hidden border-y border-white/5 py-4">
        <AnimatePresence mode="popLayout">
          <div className="flex flex-col gap-3">
            {recentConcepts.map((concept, i) => (
              <motion.div
                key={concept.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ 
                  x: 0, 
                  opacity: 1,
                  filter: signalGlitch && Math.random() > 0.8 ? 'blur(2px) brightness(1.5)' : 'none'
                }}
                transition={{ 
                  delay: i * 0.1,
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  repeatDelay: 10 / scrollSpeed
                }}
                className="flex items-center gap-4 bg-white/5 hover:bg-accent-phi-1/10 p-3 rounded-lg border border-white/5 hover:border-accent-phi-1/40 transition-colors cursor-pointer group/item"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-phi-1/20 flex items-center justify-center text-[10px] font-bold text-accent-phi-1 border border-accent-phi-1/40">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white uppercase truncate">{concept.title}</span>
                    <span className="text-[8px] text-accent-phi-1/60 px-1.5 py-0.5 border border-accent-phi-1/20 rounded">
                      {concept.tags[0]}
                    </span>
                  </div>
                  <div className="text-[9px] text-text-muted line-clamp-1 leading-tight group-hover/item:line-clamp-none transition-all">
                    {concept.description}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[9px] font-bold text-primary">{concept.mastery}%</div>
                  <div className="w-12 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${concept.mastery}%` }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>

      {/* Footer Diagnostic */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/5">
          <Database className="w-3 h-3 text-primary" />
          <div className="flex flex-col">
            <span className="text-[8px] text-text-muted uppercase">Lattice Cache</span>
            <span className="text-[10px] text-white font-bold">OPTIMIZED</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/5">
          <ShieldAlert className="w-3 h-3 text-accent-phi-1" />
          <div className="flex flex-col">
            <span className="text-[8px] text-text-muted uppercase">Integrity</span>
            <span className="text-[10px] text-white font-bold">{signalGlitch ? 'DEGRADED' : 'NOMINAL'}</span>
          </div>
        </div>
      </div>

      {/* Speed Overlay */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white/20 select-none pointer-events-none">
        <Cpu className="w-3 h-3" />
        <span className="text-[8px] tracking-tighter">PROC_CLK: {(cpuLoad * 5.2).toFixed(2)} GHz</span>
      </div>
    </div>
  );
}
