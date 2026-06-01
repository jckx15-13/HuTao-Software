// ============================================================================
// 📦 App Shell Container (App.tsx)
// ============================================================================
// Low-level mechanics: 
// 1. Coordinates page state layout dynamically based on Zustand store settings.
// 2. Applies global dynamic CSS style overrides (appStyle/backgroundStyle) at the body root.
// 3. Performs lazy-loading fallback boundaries (Suspense) for large components.
// ============================================================================

import { AnimatePresence } from 'motion/react'; // Handles exit transitions: keeps components in the DOM until their fade/slide animations finish.
import { Settings } from 'lucide-react'; // Lucide SVG icon definition for the gear button.
import React, { Suspense } from 'react'; // React default + Suspense for lazy imports.
import { DockedLayout } from './components/layout/DockedLayout'; // Workspace structure defining Left, Center, and Right panels.
import { IconButton } from './components/common/IconButton'; // Standardized accessible button component with hover glow effects.
import { ParticleOverlay } from './components/ParticleOverlay'; // Canvas element rendering floating background canvas shapes.
import { CesiumBackground } from './components/background/CesiumBackground'; // Virtual Earth component rendered on a persistent background layer.
import { LauncherPage } from './components/launcher/LauncherPage'; // Welcome/Splash component shown when first loading the interface.
import { SettingsPage } from './components/settings/SettingsPage'; // Configuration panel (lazy loaded to reduce initial bundle size).
import { ErrorBoundary } from './components/ErrorBoundary'; // React error boundary: catches runtime crashes inside nested components without freezing the tab.
import { CustomCursor } from './components/layout/CustomCursor'; // Custom pointer element that tracks client mouse moves.
import { useThemeVariables } from './hooks/useThemeVariables'; // Computes current palette style objects and monitors CPU strain.
import { useUIStore } from './store/uiStore'; // Shared state manager (Zustand) tracking navigation and user preferences.
import { ConfigProvider } from './context/ConfigContext';

// Dev-only harness: lazy-load to avoid impacting production bundles
const MountUnmountHarness = React.lazy(() => import('./components/dev/MountUnmountHarness'));

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
export default function App() {
  // Subscription selectors: only trigger re-renders when these specific properties change in the Zustand store.
  const currentPage = useUIStore((state) => state.currentPage);
  const interactionMode = useUIStore((state) => state.interactionMode);
  const customWallpaper = useUIStore((state) => state.customWallpaper);
  const scanlineOverlay = useUIStore((state) => state.scanlineOverlay);
  
  // Detect if running in headless test/fallback mode
  const isHeadless = typeof window !== 'undefined' && (
    /HeadlessChrome/i.test(navigator.userAgent) ||
    navigator.webdriver ||
    window.location.search.includes('fallback')
  );

  // Dev harness toggle: append `?mountharness` to the URL to open the mount/unmount harness
  const showHarness = typeof window !== 'undefined' && window.location.search.includes('mountharness');

  // Destructures computed theme object and the CPU load state.
  const { appStyle, isHighLoad } = useThemeVariables();

  // If a custom image URL exists, build background style overrides.
  const backgroundStyle = customWallpaper
    ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <ConfigProvider>
      {/* Outer viewport root container. Covers whole screen (h-screen, w-full), disables default scrolls (overflow-hidden). */}
      <div
        className={`relative flex h-screen w-full overflow-hidden bg-base font-sans text-text-main transition-colors duration-500 ${
          isHighLoad ? 'state-high-load' : '' // High load CSS class: throttles expensive SVG/canvas calculations when active.
        } ${isHeadless ? 'is-headless' : ''}`}
        style={{ ...appStyle, ...backgroundStyle }} // Merge global theme CSS variables with optional background image style.
      >
      {/* 🌍 3D MAP BACKGROUND: Cesium globe element. Disabled if custom wallpaper is used to save memory. */}
      {!customWallpaper && (
        <CesiumBackground interactive={interactionMode === 'orbital' || interactionMode === 'telescope'} />
      )}

      {/* 🕶️ BACKDROP SHADE: Semi-translucent screen layer. Fades the map so chat text contrast remains high. */}
      {interactionMode !== 'orbital' && interactionMode !== 'telescope' && (
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
          {/* Performance Optimization: Turn off floaty dots and custom cursor tracks if CPU is struggling. */}
          {!isHighLoad && <ParticleOverlay />}
          {!isHighLoad && <CustomCursor appHighLoad={isHighLoad} />}
          
          {/* Cyberpunk flicker screen overlay */}
          {scanlineOverlay && <div className="hologram-overlay" />}
          
          <TopAppBar />

          {/* Core viewport layouts: pt-12 leaves space for the 12-unit top app bar */}
          <div className="relative z-10 flex h-full w-full pt-12 pointer-events-none">
            <DockedLayout />
          </div>

          {/* Dev harness overlay (rendered when ?mountharness is present) */}
          {showHarness && (
            <Suspense fallback={null}>
              <MountUnmountHarness />
            </Suspense>
          )}

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
    </ConfigProvider>
  );
}
