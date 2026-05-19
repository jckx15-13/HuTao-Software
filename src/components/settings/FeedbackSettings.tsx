import { Sparkles, Volume2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { SettingsSection } from './SettingsSection';

export function FeedbackSettings() {
  const particleEffects = useUIStore((state) => state.particleEffects);
  const audioFeedback = useUIStore((state) => state.audioFeedback);
  const updateSettings = useUIStore((state) => state.updateSettings);

  const items = [
    { 
      icon: Sparkles, 
      label: 'Motion Engine', 
      val: particleEffects, 
      key: 'particleEffects' as const 
    },
    { 
      icon: Volume2, 
      label: 'Audio Feedback', 
      val: audioFeedback, 
      key: 'audioFeedback' as const 
    }
  ];

  return (
    <SettingsSection title="Sensory">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between px-4 py-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
            onClick={() => updateSettings({ [item.key]: !item.val })}
          >
            <div className="flex items-center gap-3">
              <item.icon size={16} className={`transition-colors ${item.val ? 'text-primary' : 'text-white/20'}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${item.val ? 'text-white/80' : 'text-white/30'}`}>
                {item.label}
              </span>
            </div>
            <div className={`w-8 h-4 rounded-full transition-all relative ${item.val ? 'bg-primary/30' : 'bg-white/10'}`}>
              <div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${item.val ? 'right-1 bg-primary shadow-[0_0_8px_var(--primary-glow)]' : 'left-1 bg-white/20'}`} />
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
