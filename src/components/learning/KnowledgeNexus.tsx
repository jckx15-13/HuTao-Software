/**
 * MODULE: Knowledge Nexus
 * FEATURE: Neural Map Visualization
 * 
 * PURPOSE:
 * A 2.5D grid visualization of ingested neural concepts. 
 * This module uses system metrics (CPU load, Network latency) to drive 
 * the intensity and speed of the node animations, creating a direct 
 * link between hardware state and learning data.
 */
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useLearningStore } from '../../store/learningStore';
import { useUIStore } from '../../store/uiStore';
import { Activity, Cpu, Network } from 'lucide-react';

export function KnowledgeNexus() {
  const { concepts } = useLearningStore();
  const { cpuLoad, systemMetrics } = useUIStore();

  // We arrange the concepts in a pseudo-3D grid.
  const nodes = useMemo(() => {
    return concepts.map((concept, i) => {
      // Calculate a spiral or grid layout
      const angle = i * 0.5;
      const radius = 20 + i * 8;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return { ...concept, x, y };
    });
  }, [concepts]);

  // Higher CPU load increases the "jitter" or "instability" of the nodes.
  const jitter = cpuLoad * 2;
  const pulseSpeed = 1 / (1 + systemMetrics.networkLatency);

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-black/40 backdrop-blur-xl border border-primary/20 rounded-xl p-4 font-mono">
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 text-[10px] text-primary/80">
          <Activity className="w-3 h-3" />
          <span>NEURAL // DENSITY: {concepts.length} UNITS</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-accent-phi-1/80">
          <Cpu className="w-3 h-3" />
          <span>SYNC // STABILITY: {((1 - cpuLoad) * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* The Nexus Graph */}
      <div className="relative flex-1 flex items-center justify-center p-12">
        <div className="relative w-full h-full max-w-2xl max-h-2xl flex items-center justify-center">
          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              className="absolute w-2 h-2 rounded-full cursor-help group"
              style={{
                left: `calc(50% + ${node.x}px)`,
                top: `calc(50% + ${node.y}px)`,
                backgroundColor: node.mastery > 50 ? 'var(--theme-primary)' : 'var(--theme-accent-phi-1)',
                boxShadow: `0 0 ${10 + (node.mastery / 5)}px ${node.mastery > 50 ? 'var(--theme-primary)' : 'var(--theme-accent-phi-1)'}`,
              }}
              animate={{
                x: [0, Math.random() * jitter, -Math.random() * jitter, 0],
                y: [0, Math.random() * jitter, -Math.random() * jitter, 0],
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: pulseSpeed * (2 + Math.random() * 2),
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Tooltip on Hover */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 bg-base/90 border border-primary/30 p-2 rounded scale-0 group-hover:scale-100 transition-transform origin-bottom z-30 pointer-events-none backdrop-blur-md">
                <div className="text-[10px] font-bold text-white mb-1 uppercase truncate">{node.title}</div>
                <div className="text-[8px] text-text-muted mb-2 line-clamp-2 leading-tight">{node.description}</div>
                <div className="flex justify-between items-center border-t border-primary/20 pt-1">
                  <span className="text-[7px] text-primary">MASTERY</span>
                  <span className="text-[9px] text-white font-bold">{node.mastery}%</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Connection Lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            {nodes.slice(0, -1).map((node, i) => {
              const next = nodes[i + 1];
              return (
                <motion.line
                  key={`line-${i}`}
                  x1={`calc(50% + ${node.x}px)`}
                  y1={`calc(50% + ${node.y}px)`}
                  x2={`calc(50% + ${next.x}px)`}
                  y2={`calc(50% + ${next.y}px)`}
                  stroke="var(--theme-primary)"
                  strokeWidth="0.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: i * 0.1 }}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Footer Readouts */}
      <div className="mt-auto border-t border-primary/20 pt-3 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <span className="text-[7px] uppercase tracking-[0.3em] text-text-muted">Diagnostic: Link Active</span>
          <div className="flex gap-0.5">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-3 rounded-t-sm ${i < (1 - systemMetrics.networkLatency) * 20 ? 'bg-primary' : 'bg-primary/10'}`} 
              />
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-white font-bold block">NEXUS_v6.02</span>
          <span className="text-[8px] text-text-muted uppercase">Ready for Ingestion</span>
        </div>
      </div>
    </div>
  );
}
