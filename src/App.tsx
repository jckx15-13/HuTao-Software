// ============================================================================
// 🧱 Main Application Shell (App.tsx)
// ============================================================================
// Coordinates application routing, theme provider tokens, modal drawers, and background views.
// ============================================================================

import React, { Suspense } from 'react';
import { MotionConfig } from 'motion/react';
import { useUIStore } from './store/uiStore';
import { ConfigProvider } from './context/ConfigContext';
import { useDiagnosticsStore } from './store/diagnosticsStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useThemeVariables } from './hooks/useThemeVariables';
import { ErrorBoundary } from './components/ErrorBoundary';

const ParticleOverlay = React.lazy(() =>
  import('./components/ParticleOverlay').then((m) => ({ default: m.ParticleOverlay }))
);

const CesiumBackground3D = React.lazy(() =>
  import('./components/background/CesiumBackground3D').then((m) => ({ default: m.CesiumBackground3D }))
);

const LauncherPage = React.lazy(() =>
  import('./components/launcher/LauncherPage').then((m) => ({ default: m.LauncherPage }))
);

const DockedLayout = React.lazy(() =>
  import('./components/layout/DockedLayout').then((m) => ({ default: m.DockedLayout }))
);

function AppContent() {
  const isHighLoad = useUIStore((s) => s.isHighLoad);
  const particleEffects = useUIStore((s) => s.particleEffects);
  const isSpaceMode = useUIStore((s) => s.interactionMode === 'orbital' || s.interactionMode === 'telescope');

  return (
    <>
      <Suspense fallback={null}>
        <CesiumBackground3D />
      </Suspense>
      {particleEffects && !isHighLoad && (
        <Suspense fallback={null}>
          <ParticleOverlay />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <DockedLayout />
      </Suspense>
    </>
  );
}

const SettingsPage = React.lazy(() =>
  import('./components/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const MountUnmountHarness = React.lazy(() => import('./components/dev/MountUnmountHarness'));
const DiagnosticPanel = React.lazy(() => import('./components/dev/DiagnosticPanel'));

export default function App() {
  useKeyboardShortcuts();
  const currentPage = useUIStore((state) => state.currentPage);
  const launcherDismissed = useUIStore((state) => state.launcherDismissed);
  const interactionMode = useUIStore((state) => state.interactionMode);
  const customWallpaper = useUIStore((state) => state.customWallpaper);
  const particleEffects = useUIStore((state) => state.particleEffects);
  const cosmosBackgroundMode = useUIStore((state) => state.cosmosBackgroundMode);

  const isHeadless =
    typeof window !== 'undefined' &&
    (/HeadlessChrome/i.test(navigator.userAgent) || window.location.search.includes('fallback'));

  const isLowPerformance =
    typeof window !== 'undefined' &&
    (window.location.search.includes('low-perf') ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
      ((navigator as { deviceMemory?: number }).deviceMemory !== undefined &&
        (navigator as { deviceMemory?: number }).deviceMemory! <= 4));

  React.useEffect(() => {
    if (isLowPerformance) {
      useUIStore.getState().setParticleEffects(false);
      useUIStore.getState().updatePersonalisation({ animationIntensity: 0.2 });
    }
  }, [isLowPerformance]);

  const showHarness = typeof window !== 'undefined' && window.location.search.includes('mountharness');
  const showDiagnostics = typeof window !== 'undefined' && window.location.search.includes('diagnostics');
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);
  const showLauncher = currentPage === 'launcher' && !launcherDismissed;
  const isSpaceMode = interactionMode === 'orbital' || interactionMode === 'telescope';

  React.useEffect(() => {
    if (isHeadless || showHarness || showDiagnostics) {
      setCurrentPage('workspace');
    }
  }, [isHeadless, showHarness, showDiagnostics, setCurrentPage]);

  React.useEffect(() => {
    if (launcherDismissed && currentPage === 'launcher') {
      setCurrentPage('workspace');
    }
  }, [currentPage, launcherDismissed, setCurrentPage]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('is-headless', isHeadless);
    document.body.classList.toggle('is-headless', isHeadless);
  }, [isHeadless]);

  React.useEffect(() => {
    useDiagnosticsStore.getState().add({
      level: 'info',
      message: 'Silver Wolf VI runtime diagnostics initialized.',
      metadata: {
        version: 'v6.2.0-stable',
        diagnosticEngine: 'active',
        bridgeProxy: 'configurable',
        standardizedTheme: 'active'
      }
    });
  }, []);

  const { appStyle, isHighLoad } = useThemeVariables();

  const backgroundStyle = customWallpaper
    ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  const settingsOverlay =
    currentPage === 'settings' ? (
      <Suspense fallback={null}>
        <ErrorBoundary>
          <SettingsPage />
        </ErrorBoundary>
      </Suspense>
    ) : null;

  return (
    <ConfigProvider>
      <MotionConfig reducedMotion={isHeadless ? 'always' : 'user'}>
        <div
          className={`relative flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-base font-sans text-text-main transition-colors duration-500 ${
            isHighLoad ? 'state-high-load' : ''
          } ${isHeadless ? 'is-headless' : ''}`}
          style={{ ...appStyle, ...backgroundStyle }}
        >
          {!customWallpaper && (
            <div className="absolute inset-0 z-base">
              {isSpaceMode && (
                <div
                  className={`absolute inset-0 ${cosmosBackgroundMode === 'deep-black' ? 'bg-black' : 'bg-[#02040a]'}`}
                  aria-hidden="true"
                />
              )}
              <div className="absolute inset-0 transition-all duration-500 ease-in-out z-base">
                <Suspense fallback={null}>
                  <CesiumBackground3D />
                </Suspense>
              </div>
            </div>
          )}

          <div className="relative flex h-full w-full flex-col z-content pointer-events-none">
            {showLauncher ? (
              <Suspense fallback={null}>
                <LauncherPage />
              </Suspense>
            ) : showHarness ? (
              <Suspense fallback={null}>
                <MountUnmountHarness />
              </Suspense>
            ) : showDiagnostics ? (
              <Suspense fallback={null}>
                <DiagnosticPanel />
              </Suspense>
            ) : (
              <AppContent />
            )}
          </div>

          {settingsOverlay}
        </div>
      </MotionConfig>
    </ConfigProvider>
  );
}
