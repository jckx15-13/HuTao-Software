import { AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';
import { Suspense } from 'react';
import { DockedLayout } from './components/layout/DockedLayout';
import { IconButton } from './components/common/IconButton';
import { ParticleOverlay } from './components/ParticleOverlay';
import { CesiumBackground } from './components/background/CesiumBackground';
import { LauncherPage } from './components/launcher/LauncherPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { CustomCursor } from './components/layout/CustomCursor';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useUIStore } from './store/uiStore';

function TopAppBar() {
  const currentPage = useUIStore((state) => state.currentPage);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);

  return (
    <div className="absolute left-0 top-0 z-20 flex h-12 w-full items-center justify-between border-b border-panel-border bg-panel/50 px-4 panel-glass">
      <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest text-primary">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--theme-primary)]" />
        <span>Silver Wolf VI</span>
      </div>
      <IconButton
        icon={Settings}
        label={currentPage === 'settings' ? 'Close settings' : 'Open settings'}
        onClick={() => setCurrentPage(currentPage === 'settings' ? 'workspace' : 'settings')}
      />
    </div>
  );
}

export default function App() {
  const currentPage = useUIStore((state) => state.currentPage);
  const interactionMode = useUIStore((state) => state.interactionMode);
  const customWallpaper = useUIStore((state) => state.customWallpaper);
  const scanlineOverlay = useUIStore((state) => state.scanlineOverlay);
  const { appStyle, isHighLoad } = useThemeVariables();

  // Background style overlay if custom wallpaper is set
  const backgroundStyle = customWallpaper
    ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <div
      className={`relative flex h-screen w-full overflow-hidden bg-base font-sans text-text-main transition-colors duration-500 ${
        isHighLoad ? 'state-high-load' : ''
      }`}
      style={{ ...appStyle, ...backgroundStyle }}
    >
      {/* Background layer: Persistent 3D Cesium Earth Map */}
      {!customWallpaper && (
        <CesiumBackground interactive={interactionMode === 'orbital' || interactionMode === 'telescope'} />
      )}

      {/* Translucent overlay filter for non-orbital modes */}
      {interactionMode !== 'orbital' && interactionMode !== 'telescope' && (
        <div className="absolute inset-0 bg-[#06070a]/75 backdrop-blur-[2px] pointer-events-none z-0" />
      )}

      {/* Cyberpunk Scanline filter */}
      {scanlineOverlay && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
      )}

      {currentPage === 'launcher' ? (
        <LauncherPage />
      ) : (
        <>
          {!isHighLoad && <ParticleOverlay />}
          {!isHighLoad && <CustomCursor />}
          {scanlineOverlay && <div className="hologram-overlay" />}
          
          <TopAppBar />

          <div className="relative z-10 flex h-full w-full pt-12 pointer-events-none">
            <DockedLayout />
          </div>

          <AnimatePresence>
            {currentPage === 'settings' && (
              <Suspense fallback={null}>
                <SettingsPage />
              </Suspense>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
