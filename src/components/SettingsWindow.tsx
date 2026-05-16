import { useRef } from 'react';
import { motion, useDragControls, useMotionValue } from 'motion/react';
import { Settings2, X } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { ThemeSettings } from './settings/ThemeSettings';
import { AiSettings } from './settings/AiSettings';
import { FeedbackSettings } from './settings/FeedbackSettings';
import { NotionSettings } from './settings/NotionSettings';

export function SettingsWindow({ onClose }: { onClose: () => void }) {
  const updateSettings = useUIStore((state) => state.updateSettings);
  const controls = useDragControls();
  
  const x = useMotionValue(100);
  const y = useMotionValue(100);

  const handlePointerDown = (e: React.PointerEvent) => {
    controls.start(e);
  };

  return (
    <motion.div
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      style={{ x, y, transformPerspective: 1200 }}
      initial={{ opacity: 0, scale: 0.95, y: 120 }}
      animate={{ opacity: 1, scale: 1, y: 100 }}
      exit={{ opacity: 0, scale: 0.9, y: 120 }}
      className="fixed z-[100] flex flex-col overflow-hidden border border-white/10 bg-black/40 shadow-[0_0_50px_rgba(0,0,0,0.5)] panel-glass backdrop-blur-2xl w-[440px] max-h-[80vh] rounded-2xl"
    >
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
      >
        <div className="font-mono text-primary text-[10px] uppercase tracking-[0.2em] font-black flex items-center gap-3">
          <Settings2 size={14} className="animate-spin-slow" /> 
          <span>System Config</span>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-10 scroller pb-12">
        <ThemeSettings />
        <AiSettings />
        <FeedbackSettings />
        <NotionSettings />
        
        <div className="pt-8 border-t border-white/5">
          <div className="text-[9px] uppercase tracking-[0.2em] text-center text-white/20 font-bold">
            Silver Wolf Protocol // v6.4.0-PRIME
          </div>
        </div>
      </div>
    </motion.div>
  );
}

