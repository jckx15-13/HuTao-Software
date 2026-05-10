import { AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';
import { DockedLayout } from './components/layout/DockedLayout';
import { IconButton } from './components/common/IconButton';
import { ParticleOverlay } from './components/ParticleOverlay';
import { SettingsWindow } from './components/SettingsWindow';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useUIStore } from './store/uiStore';

function TopAppBar() {
  const showSettings = useUIStore((state) => state.showSettings);
  const setShowSettings = useUIStore((state) => state.setShowSettings);

  return (
    <div className="absolute left-0 top-0 z-20 flex h-12 w-full items-center justify-between border-b border-panel-border bg-panel/50 px-4 panel-glass">
      <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest text-primary">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--theme-primary)]" />
        <span>Silver Wolf VI</span>
      </div>
      <IconButton
        icon={Settings}
        label={showSettings ? 'Close settings' : 'Open settings'}
        onClick={() => setShowSettings(!showSettings)}
      />
    </div>
  );
}

export default function App() {
  const showSettings = useUIStore((state) => state.showSettings);
  const setShowSettings = useUIStore((state) => state.setShowSettings);
  const { appStyle, isHighLoad } = useThemeVariables();

  return (
    <div
      className={`relative flex h-screen w-full overflow-hidden bg-base font-sans text-text-main transition-colors duration-500 ${
        isHighLoad ? 'state-high-load' : ''
      }`}
      style={appStyle}
    >
      <ParticleOverlay />
      <div className="hologram-overlay" />

      <TopAppBar />

      <div className="relative z-10 flex h-full w-full pt-12">
        <DockedLayout />
      </div>

      <AnimatePresence>
        {showSettings && <SettingsWindow onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
}
