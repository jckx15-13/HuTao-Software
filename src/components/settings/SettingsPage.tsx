import { X, Palette, Brain, Link2, Sparkles, Info, Code, Map as MapIcon } from 'lucide-react';
import { useUIStore, type SettingsCategory } from '@/store/uiStore';
import { lazy, Suspense } from 'react';

const PersonalisationSettings = lazy(() =>
  import('./PersonalisationSettings').then((m) => ({ default: m.PersonalisationSettings }))
);
const GlassOpacitySettings = lazy(() => import('./GlassOpacitySettings'));
const AiSettings = lazy(() =>
  import('./AiSettings').then((m) => ({ default: m.AiSettings }))
);
const NotionSettings = lazy(() =>
  import('./NotionSettings').then((m) => ({ default: m.NotionSettings }))
);
const FeedbackSettings = lazy(() =>
  import('./FeedbackSettings').then((m) => ({ default: m.FeedbackSettings }))
);
const DeveloperSettings = lazy(() =>
  import('./DeveloperSettings').then((m) => ({ default: m.DeveloperSettings }))
);
const MapSettings = lazy(() =>
  import('./MapSettings').then((m) => ({ default: m.MapSettings }))
);

export function SettingsPage() {
  const settingsCategory = useUIStore((s) => s.settingsCategory);
  const setSettingsCategory = useUIStore((s) => s.setSettingsCategory);
  const setCurrentPage = useUIStore((s) => s.setCurrentPage);

  const categories: { key: SettingsCategory; label: string; icon: typeof Palette }[] = [
    { key: 'personalisation', label: 'Personalisation', icon: Palette },
    { key: 'ai', label: 'AI Configuration', icon: Brain },
    { key: 'connections', label: 'Notion Sync', icon: Link2 },
    { key: 'feedback', label: 'Feedback', icon: Sparkles },
    { key: 'developer' as SettingsCategory, label: 'Developer Panel', icon: Code },
    { key: 'map' as SettingsCategory, label: 'Map & Imagery', icon: MapIcon },
    { key: 'about', label: 'About', icon: Info },

  ];

  return (
    <div
      className="fixed inset-0 z-50 flex h-[100dvh] min-h-[100dvh] w-full bg-[#06070a]/92 backdrop-blur-2xl overflow-hidden settings-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="w-full h-full flex overflow-hidden relative">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setCurrentPage('workspace')}
          className="absolute top-6 right-6 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white/40 hover:bg-white/10 hover:text-white/80 transition-all cursor-pointer shadow-lg"
          aria-label="Exit Settings"
          title="Exit Settings"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Sidebar Nav */}
        <aside className="w-[clamp(11rem,24vw,13.75rem)] bg-black/30 border-r border-white/5 p-4 flex flex-col font-mono shrink-0">
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
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
            <Suspense fallback={<div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Loading settings...</div>}>
              {settingsCategory === 'personalisation' && (<>
                  <PersonalisationSettings />
                  <GlassOpacitySettings />
                </>)}
              {settingsCategory === 'ai' && <AiSettings />}
              {settingsCategory === 'connections' && <NotionSettings />}
              {settingsCategory === 'feedback' && <FeedbackSettings />}
              {settingsCategory === 'map' && <MapSettings />}
              {settingsCategory === 'developer' && <DeveloperSettings />}
              {settingsCategory === 'about' && <AboutSection />}
            </Suspense>
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
          Chat, map, and astronomy workspace with local fallback AI, optional Gemini and Odysseus bridge routes, ArcGIS imagery, and source-mapped integration panels.
        </p>

        <div className="border-t border-white/5 pt-3 space-y-2 text-[9px]">
          <div className="flex justify-between">
            <span className="text-white/30 uppercase">Build Version</span>
            <span className="text-white/80 font-bold">v6.5.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/30 uppercase">Cesium engine</span>
            <span className="text-white/80 font-bold">v1.142.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/30 uppercase">Vite runtime</span>
            <span className="text-white/80 font-bold">v6.4.3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/30 uppercase">Zustand state</span>
            <span className="text-white/80 font-bold">v5.0.13</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 border border-white/5 space-y-2 rounded-xl text-[9px] uppercase leading-relaxed text-white/40">
        <div>Security note: this browser stores app state locally unless a configured bridge route is used.</div>
        <div>Bridge note: Odysseus memory, task, and model data require the local bridge service to be running.</div>
      </div>
    </div>
  );
}
