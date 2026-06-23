// ============================================================================
// 📦 App Shell Container (App.tsx)
// ============================================================================
// Low-level mechanics: 
// 1. Coordinates page state layout dynamically based on Zustand store settings.
// 2. Applies global dynamic CSS style overrides (appStyle/backgroundStyle) at the body root.
// 3. Performs lazy-loading fallback boundaries (Suspense) for large components.
// ============================================================================

import { AnimatePresence, MotionConfig } from 'motion/react'; // Handles exit transitions: keeps components in the DOM until their fade/slide animations finish.
import { Settings } from 'lucide-react'; // Lucide SVG icon definition for the gear button.
import React, { Suspense } from 'react'; // React default + Suspense for lazy imports.
import { DockedLayout } from './components/layout/DockedLayout'; // Workspace structure defining Left, Center, and Right panels.
import { IconButton } from './components/common/IconButton'; // Standardized accessible button component with hover glow effects.
import { ParticleOverlay } from './components/ParticleOverlay'; // Canvas element rendering floating background canvas shapes.
import { CesiumBackground } from './components/background/CesiumBackground'; // Virtual Earth component rendered on a persistent background layer.
import { LauncherPage } from './components/launcher/LauncherPage'; // Welcome/Splash component shown when first loading the interface.
import { ErrorBoundary } from './components/ErrorBoundary'; // React error boundary: catches runtime crashes inside nested components without freezing the tab.
import { CustomCursor } from './components/layout/CustomCursor'; // Custom pointer element that tracks client mouse moves.
import { useThemeVariables } from './hooks/useThemeVariables'; // Computes current palette style objects and monitors CPU strain.
import { useUIStore } from './store/uiStore'; // Shared state manager (Zustand) tracking navigation and user preferences.
import { ConfigProvider } from './context/ConfigContext';

// Lazy load SettingsPage configuration panel to reduce initial bundle size
const SettingsPage = React.lazy(() =>
  import('./components/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
import { useDiagnosticsStore } from './store/diagnosticsStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Dev-only harness: lazy-load to avoid impacting production bundles
const MountUnmountHarness = React.lazy(() => import('./components/dev/MountUnmountHarness'));
const DiagnosticPanel = React.lazy(() => import('./components/dev/DiagnosticPanel'));

// ----------------------------------------------------------------------------
// 🏷️ Top Navigation Bar
// ----------------------------------------------------------------------------
function TopAppBar() {
  // Read target page states from the Zustand memory store to set toggled visibility.
  const currentPage = useUIStore((state) => state.currentPage);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);

  return (
    // Uses absolute positioning to stay at the top and z-index 20 to sit above background map canvas.
    <div className="absolute left-0 top-0 z-20 flex h-12 w-full items-center justify-between border-b border-panel-border bg-panel/50 px-4 panel-glass">
      <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest text-primary">
        {/* Glow indicator: styled using a box shadow colored by the primary theme variable */}
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--theme-primary)]" />
        <span className="glitch-target hover-glitch cursor-pointer" data-text="Silver Wolf VI">Silver Wolf VI</span>
      </div>
      {/* settings icon: clicking updates Zustand page string, triggering main App page re-render */}
      <IconButton
        icon={Settings}
        label={currentPage === 'settings' ? 'Close settings' : 'Open settings'}
        onClick={() => setCurrentPage(currentPage === 'settings' ? 'workspace' : 'settings')}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// 👑 Core Application Entrypoint
// ----------------------------------------------------------------------------
const WorldWideTelescopeView = React.lazy(() => import('./components/learning/WorldWideTelescopeView'));

export default function App() {
  useKeyboardShortcuts();
  // Subscription selectors: only trigger re-renders when these specific properties change in the Zustand store.
  const currentPage = useUIStore((state) => state.currentPage);
  const interactionMode = useUIStore((state) => state.interactionMode);
  const customWallpaper = useUIStore((state) => state.customWallpaper);
  const scanlineOverlay = useUIStore((state) => state.scanlineOverlay);
  const spaceBlendOpacity = useUIStore((state) => state.spaceBlendOpacity);
  const spaceInteractionTarget = useUIStore((state) => state.spaceInteractionTarget);
  
  // Detect if running in headless test/fallback mode
  const isHeadless = typeof window !== 'undefined' && (
    /HeadlessChrome/i.test(navigator.userAgent) ||
    window.location.search.includes('fallback')
  );

  // Dev harness toggle: append `?mountharness` to the URL to open the mount/unmount harness
  const showHarness = typeof window !== 'undefined' && window.location.search.includes('mountharness');
  const showDiagnostics = typeof window !== 'undefined' && window.location.search.includes('diagnostics');
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);
  const isSpatialInteraction = interactionMode === 'orbital' || interactionMode === 'telescope';

  // If audit/dev toggles are present, force the app into workspace so overlays render.
  React.useEffect(() => {
    try {
      if (isHeadless || showHarness || showDiagnostics) {
        setCurrentPage('workspace');
      }
    } catch (e) {}
  }, [isHeadless, showHarness, showDiagnostics, setCurrentPage]);

  // Sync is-headless class to html/body for portal styling overrides
  React.useEffect(() => {
    try {
      if (isHeadless) {
        document.documentElement.classList.add('is-headless');
        document.body.classList.add('is-headless');
      } else {
        document.documentElement.classList.remove('is-headless');
        document.body.classList.remove('is-headless');
      }
    } catch (e) {}
  }, [isHeadless]);

  React.useEffect(() => {
    // Report holistic upgrade status to the new diagnostic engine
    useDiagnosticsStore.getState().add({
      level: 'info',
      message: 'Silver Wolf VI Holistic Upgrade Complete.',
      metadata: {
        version: 'v6.2.0-stable',
        diagnosticEngine: 'active',
        bridgeProxy: 'active',
        standardizedTheme: 'active'
      }
    });
  }, []);

  // Destructures computed theme object and the CPU load state.
  const { appStyle, isHighLoad } = useThemeVariables();

  // If a custom image URL exists, build background style overrides.
  const backgroundStyle = customWallpaper
    ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;
  const workspaceIsolationProps = currentPage === 'settings'
    ? { inert: true, 'aria-hidden': true }
    : {};

  return (
    <ConfigProvider>
      <MotionConfig reducedMotion={isHeadless ? "always" : "user"}>
      {/* Outer viewport root container. Covers whole screen (h-screen, w-full), disables default scrolls (overflow-hidden). */}
      <div
        className={`relative flex h-screen w-full overflow-hidden bg-base font-sans text-text-main transition-colors duration-500 ${
          isHighLoad ? 'state-high-load' : '' // High load CSS class: throttles expensive SVG/canvas calculations when active.
        } ${isHeadless ? 'is-headless' : ''}`}
        style={{ ...appStyle, ...backgroundStyle }} // Merge global theme CSS variables with optional background image style.
      >
      {/* 🌍 3D MAP & SPACE BACKGROUND: Layered WWT and Cesium Globe */}
      {!customWallpaper && (
        <div className="absolute inset-0 z-0">
          {/* 1. Telescope Background Layer (WWT) at z-0 */}
          {(interactionMode === 'orbital' || interactionMode === 'telescope') && (!isHeadless || spaceInteractionTarget === 'telescope' || interactionMode === 'telescope') && (
            <div
              className="absolute inset-0 z-0 transition-opacity duration-500"
              style={{
                opacity: spaceInteractionTarget === 'telescope' || interactionMode === 'telescope' ? 0.26 : 1,
                mixBlendMode: spaceInteractionTarget === 'telescope' || interactionMode === 'telescope' ? 'screen' : 'normal'
              }}
            >
              <Suspense fallback={null}>
                <WorldWideTelescopeView bgOnly />
              </Suspense>
            </div>
          )}
          
          {/* 2. Earth Globe Background Layer (Cesium) at z-10 */}
          <div 
            className="absolute inset-0 transition-all duration-500 ease-in-out"
            style={{
              zIndex: 10,
              opacity: (interactionMode === 'orbital' || interactionMode === 'telescope')
                ? ((spaceInteractionTarget === 'telescope' || interactionMode === 'telescope') ? Math.max(0.92, spaceBlendOpacity) : 1.0)
                : 1.0,
              pointerEvents: (interactionMode === 'orbital' || interactionMode === 'telescope') && (spaceInteractionTarget === 'earth' && interactionMode !== 'telescope') ? 'auto' : 'none'
            }}
          >
            <CesiumBackground interactive={(interactionMode === 'orbital' || interactionMode === 'telescope') && (spaceInteractionTarget === 'earth' && interactionMode !== 'telescope')} />
          </div>
        </div>
      )}

      {/* 🕶️ BACKDROP SHADE: Semi-translucent screen layer. Fades the map so chat text contrast remains high. */}
      {interactionMode === 'chat' && (
        <div className="absolute inset-0 bg-[#06070a]/75 backdrop-blur-[2px] pointer-events-none z-0" />
      )}

      {/* 📺 SCANLINE LAYER: Simulated scanlines using a CSS gradient background scaled to 4px tall repetitions. */}
      {scanlineOverlay && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
      )}

      {/* ROUTING CONTROLLER: Swaps pages by comparing active page string */}
      {currentPage === 'launcher' ? (
        <LauncherPage />
      ) : (
        <>
          <div className="contents" {...workspaceIsolationProps}>
          {/* Performance Optimization: Turn off floaty dots and custom cursor tracks if CPU is struggling. */}
          {!isHighLoad && <ParticleOverlay />}
          {!isHighLoad && <CustomCursor appHighLoad={isHighLoad} />}
          
          {/* Cyberpunk flicker screen overlay */}
          {scanlineOverlay && <div className="hologram-overlay" />}
          
          {!isSpatialInteraction && <TopAppBar />}

          {/* Core viewport layouts: pt-12 leaves space for the 12-unit top app bar, cleared in spatial modes for full-screen floating HUD */}
          <div className={`relative z-10 flex h-full w-full pointer-events-none transition-all duration-300 ${isSpatialInteraction ? 'pt-0' : 'pt-12'}`}>
            <DockedLayout />
          </div>

          {/* Dev harness overlay (rendered when ?mountharness is present) */}
          {showHarness && (
            <Suspense fallback={null}>
              <MountUnmountHarness />
            </Suspense>
          )}

          {/* Dev diagnostics overlay (rendered when ?diagnostics is present) */}
          {showDiagnostics && (
            <Suspense fallback={null}>
              <DiagnosticPanel />
            </Suspense>
          )}
          </div>

          {/* AnimatePresence monitors settings page component mounting. When currentPage !== 'settings', it plays slide-out fade before removal. */}
          <AnimatePresence>
            {currentPage === 'settings' && (
              // Suspense fallback handles loading state while SettingsPage chunks are downloaded.
              <Suspense fallback={null}>
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              </Suspense>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
      </MotionConfig>
    </ConfigProvider>
  );
}
