import { X, Palette, Brain, Link2, Sparkles, Info } from 'lucide-react';
import { useUIStore, type SettingsCategory } from '@/store/uiStore';
import { PersonalisationSettings } from './PersonalisationSettings';
import { AiSettings } from './AiSettings';
import { NotionSettings } from './NotionSettings';
import { FeedbackSettings } from './FeedbackSettings';

export function SettingsPage() {
  const settingsCategory = useUIStore((s) => s.settingsCategory);
  const setSettingsCategory = useUIStore((s) => s.setSettingsCategory);
  const setCurrentPage = useUIStore((s) => s.setCurrentPage);

  const categories: { key: SettingsCategory; label: string; icon: typeof Palette }[] = [
    { key: 'personalisation', label: 'Personalisation', icon: Palette },
    { key: 'ai', label: 'AI Configuration', icon: Brain },
    { key: 'connections', label: 'Notion Sync', icon: Link2 },
    { key: 'feedback', label: 'Tactile Feedback', icon: Sparkles },
    { key: 'about', label: 'System Codex', icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen bg-[#06070a]/92 backdrop-blur-2xl overflow-hidden settings-enter">
      <div className="w-full h-full flex overflow-hidden relative">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setCurrentPage('workspace')}
          className="absolute top-6 right-6 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-white/40 hover:bg-white/10 hover:text-white/80 transition-all cursor-pointer shadow-lg"
          title="Exit Settings"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Sidebar Nav */}
        <aside className="w-[220px] bg-black/30 border-r border-white/5 p-4 flex flex-col font-mono shrink-0">
          <div className="mb-6 px-2">
            <span className="text-[10px] font-bold text-primary block tracking-[0.2em] uppercase">SYSTEM PANEL</span>
            <span className="text-[8px] text-white/20 block tracking-widest mt-0.5">SILVER WOLF v6.5</span>
          </div>

          <div className="flex-1 space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = settingsCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSettingsCategory(cat.key)}
                  className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary/20 text-primary border-l-2 border-primary font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-white/30'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Active section header */}
          <div className="h-14 flex items-center px-6 border-b border-white/5 bg-black/10 shrink-0">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white">
              {categories.find((c) => c.key === settingsCategory)?.label}
            </h2>
          </div>

          {/* Section Body */}
          <div className="flex-1 overflow-y-auto p-6 scroller">
            {settingsCategory === 'personalisation' && <PersonalisationSettings />}
            {settingsCategory === 'ai' && <AiSettings />}
            {settingsCategory === 'connections' && <NotionSettings />}
            {settingsCategory === 'feedback' && <FeedbackSettings />}
            {settingsCategory === 'about' && <AboutSection />}
          </div>
        </main>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-4 font-mono text-[10px] text-white/60">
      <div className="glass-panel p-4 border border-white/5 space-y-3 rounded-xl">
        <h3 className="text-primary font-bold uppercase tracking-wider text-xs">SILVER WOLF CORE</h3>
        <p className="text-white/40 leading-relaxed uppercase">
          Autonomous geo-spatial intelligence workspace and neural bridge shell. Developed under Sector-6 protocol specs.
        </p>

        <div className="border-t border-white/5 pt-3 space-y-2 text-[9px]">
          <div className="flex justify-between">
            <span className="text-white/30 uppercase">Build Version</span>
            <span className="text-white/80 font-bold">v6.5.0-PRIME</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/30 uppercase">Cesium engine</span>
            <span className="text-white/80 font-bold">v1.141.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/30 uppercase">Vite runtime</span>
            <span className="text-white/80 font-bold">v6.2.3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/30 uppercase">Zustand state</span>
            <span className="text-white/80 font-bold">v5.0.13</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 border border-white/5 space-y-2 rounded-xl text-[9px] uppercase leading-relaxed text-white/40">
        <div>System security classification: LEVEL 6 DEEP CODES</div>
        <div>Warning: All interactions are logged on neural bridge.</div>
      </div>
    </div>
  );
}
