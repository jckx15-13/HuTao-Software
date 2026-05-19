import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DockedLayout } from './components/layout/DockedLayout';
import { TopAppBar } from './components/layout/TopAppBar';
import { ParticleOverlay } from './components/ParticleOverlay';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useUIStore } from './store/uiStore';

const SettingsWindow = lazy(() =>
  import('./components/SettingsWindow').then((module) => ({ default: module.SettingsWindow })),
);

export default function App() {
  const { appStyle, isHighLoad } = useThemeVariables();
  const showSettings = useUIStore((state) => state.showSettings);
  const setShowSettings = useUIStore((state) => state.setShowSettings);

  return (
    <ErrorBoundary>
      <div className="app-shell h-screen w-screen overflow-hidden bg-base text-text-main" style={appStyle}>
        <div className="app-stars" aria-hidden="true" />
        <div className="app-aurora" aria-hidden="true" />

        <TopAppBar />
        {!isHighLoad && <ParticleOverlay />}

        <div className="relative z-10 h-full pt-14">
          <DockedLayout />
        </div>

        <Suspense fallback={null}>
          {showSettings && <SettingsWindow onClose={() => setShowSettings(false)} />}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
