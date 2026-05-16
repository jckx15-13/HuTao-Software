import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Globe } from 'lucide-react';
import { TopAppBar } from './components/layout/TopAppBar';
import { DockedLayout } from './components/layout/DockedLayout';
import { BackgroundEarth } from './components/layout/BackgroundEarth';
import { SettingsWindow } from './components/SettingsWindow';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useUIStore } from './store/uiStore';

export default function App() {
  const showSettings = useUIStore((state) => state.showSettings);
  const setShowSettings = useUIStore((state) => state.setShowSettings);
  const { appStyle, isHighLoad } = useThemeVariables();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowSettings]);

  return (
    <div
      className={`relative h-screen w-full overflow-hidden bg-black text-text-main transition-colors duration-500 ${isHighLoad ? 'state-high-load' : ''}`}
      style={appStyle}
    >
      <BackgroundEarth />

      {/* Geospatial Link badge — no float animation to prevent wobble */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-4 panel-glass px-5 py-2.5 pointer-events-none">
        <div className="relative">
          <Globe className="w-5 h-5 text-primary" />
          <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Geospatial Link</span>
          <span className="text-[9px] text-white/40 uppercase">Earth // Live Render</span>
        </div>
      </div>

      <TopAppBar />

      <main className="relative z-10 flex h-full w-full pt-14">
        <DockedLayout />
      </main>

      <AnimatePresence>
        {showSettings && <SettingsWindow onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
}
