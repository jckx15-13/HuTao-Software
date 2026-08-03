import { AnimatePresence, MotionConfig } from 'motion/react';
import React, { Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigProvider } from './context/ConfigContext';
import { useDiagnosticsStore } from './store/diagnosticsStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useUIStore } from './store/uiStore';

const DockedLayout = React.lazy(() =>
  import('./components/layout/DockedLayout').then((m) => ({ default: m.DockedLayout }))
);
const CesiumBackground = React.lazy(() =>
  import('./components/background/CesiumBackground').then((m) => ({ default: m.CesiumBackground }))
);
const LauncherPage = React.lazy(() =>
  import('./components/launcher/LauncherPage').then((m) => ({ default: m.LauncherPage }))
);
const ParticleOverlay = React.lazy(() =>
  import('./components/ParticleOverlay').then((m) => ({ default: m.ParticleOverlay }))
);
const CustomCursor = React.lazy(() =>
  import('./components/layout/CustomCursor').then((m) => ({ default: m.CustomCursor }))
);

function WorkspaceFallback({ label = 'Loading workspace' }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#06070a]/80 text-center font-mono text-xs uppercase tracking-wider text-white/70">
      {label}
    </div>
  );
}

const SettingsPage = React.lazy(() =>
  import('./components/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const MountUnmountHarness = React.lazy(() => import('./components/dev/MountUnmountHarness'));
const DiagnosticPanel = React.lazy(() => import('./components/dev/DiagnosticPanel'));

const WorldWideTelescopeView = React.lazy(() => import('./components/learning/WorldWideTelescopeView'));

export default function App() {
  useKeyboardShortcuts();
  const currentPage = useUIStore((state) => state.currentPage);
  const launcherDismissed = useUIStore((state) => state.launcherDismissed);
  const interactionMode = useUIStore((state) => state.interactionMode);
  const customWallpaper = useUIStore((state) => state.customWallpaper);
  const scanlineOverlay = useUIStore((state) => state.scanlineOverlay);
  const particleEffects = useUIStore((state) => state.particleEffects);
  const motionReduced = useUIStore((state) => state.personalisation.motionReduced);
  const animationIntensity = useUIStore((state) => state.personalisation.animationIntensity);
  const spaceBlendOpacity = useUIStore((state) => state.spaceBlendOpacity);
  const spaceInteractionTarget = useUIStore((state) => state.spaceInteractionTarget);

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
  const isTelescopeTarget = spaceInteractionTarget === 'telescope' || interactionMode === 'telescope';
  const isEarthTarget = spaceInteractionTarget === 'earth' && interactionMode !== 'telescope';

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
  const workspaceIsolationProps = currentPage === 'settings' && !isHeadless ? { inert: true, 'aria-hidden': true } : {};
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
            <div className="absolute inset-0 z-0">
              {isSpaceMode && (!isHeadless || isTelescopeTarget) && (
                <div
                  className="absolute inset-0 z-0 transition-opacity duration-500"
                  style={{
                    opacity: isTelescopeTarget ? 0.26 : 1,
                    mixBlendMode: isTelescopeTarget ? 'screen' : 'normal'
                  }}
                >
                  <Suspense fallback={null}>
                    <WorldWideTelescopeView bgOnly />
                  </Suspense>
                </div>
              )}
              <div
                className="absolute inset-0 transition-all duration-500 ease-in-out"
                style={{
                  zIndex: 10,
                  opacity: isSpaceMode ? (isTelescopeTarget ? Math.max(0.92, spaceBlendOpacity) : 1.0) : 1.0,
                  pointerEvents: isSpaceMode && isEarthTarget ? 'auto' : 'none'
                }}
              >
                <Suspense fallback={null}>
                  <CesiumBackground interactive={isSpaceMode && isEarthTarget} />
                </Suspense>
              </div>
            </div>
          )}

          {interactionMode === 'chat' && (
            <div className="absolute inset-0 bg-[#06070a]/75 backdrop-blur-[2px] pointer-events-none z-0" />
          )}

          {scanlineOverlay && (
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
          )}

          {showLauncher ? (
            <Suspense fallback={<WorkspaceFallback label="Loading launch checks" />}>
              <LauncherPage />
            </Suspense>
          ) : (
            <>
              <div className="contents" {...workspaceIsolationProps}>
                {!isHighLoad && particleEffects && (
                  <Suspense fallback={null}>
                    <ParticleOverlay />
                    {!motionReduced && animationIntensity > 0.5 && <CustomCursor appHighLoad={isHighLoad} />}
                  </Suspense>
                )}

                {scanlineOverlay && <div className="hologram-overlay" />}

                <div className="relative z-10 flex h-full w-full pointer-events-none transition-all duration-300 pt-0">
                  <Suspense fallback={<WorkspaceFallback />}>
                    <DockedLayout />
                  </Suspense>
                </div>

                {showHarness && (
                  <Suspense fallback={null}>
                    <MountUnmountHarness />
                  </Suspense>
                )}

                {showDiagnostics && (
                  <Suspense fallback={null}>
                    <DiagnosticPanel />
                  </Suspense>
                )}
              </div>

              {isHeadless ? settingsOverlay : <AnimatePresence>{settingsOverlay}</AnimatePresence>}
            </>
          )}
        </div>
      </MotionConfig>
    </ConfigProvider>
  );
}
