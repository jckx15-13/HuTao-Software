import { Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useUIStore } from './store/uiStore';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';
import { LeftPanel } from './components/panels/LeftPanel';
import { CenterPanel } from './components/panels/CenterPanel';
import { RightPanel } from './components/panels/RightPanel';
import { CesiumBackground } from './components/background/CesiumBackground';
import { RenderEffectsOverlay } from './components/background/RenderEffectsOverlay';
import { LauncherPage } from './components/launcher/LauncherPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { SidebarTrigger } from './components/panels/SidebarTrigger';

export default function App() {
  const { appStyle } = useThemeVariables();
  const currentPage = useUIStore((s) => s.currentPage);
  const interactionMode = useUIStore((s) => s.interactionMode);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const panelTransitionStyle = useUIStore((s) => s.personalisation?.panelTransitionStyle ?? 'slide');
  
  // Custom customWallpaper / theme background styles
  const customWallpaper = useUIStore((s) => s.customWallpaper);
  // Scanline overlay preference (read once per render to avoid conditional hooks)
  const scanlineOverlay = useUIStore((s) => s.scanlineOverlay);

  // Background style overlay
  const backgroundStyle = customWallpaper
    ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  const showLeft = leftPanelOpen && interactionMode === 'chat';
  const showRight = rightPanelOpen && interactionMode === 'chat';

  return (
    <ErrorBoundary>
      <div 
        className="app-shell relative h-screen w-screen overflow-hidden text-text-main font-sans flex flex-col bg-bg-deep" 
        style={{ ...appStyle, ...backgroundStyle }}
      >
        {/* Background layer: Persistent Cesium Earth Map (always mounted to preserve WebGL context) */}
        {!customWallpaper && (
          <>
            <div 
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                interactionMode === 'telescope' ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <CesiumBackground interactive={interactionMode === 'orbital'} />
              <RenderEffectsOverlay />
            </div>
            
            {/* Telescope mode: starfield background optimized for embedded WWT */}
            <div 
              className={`absolute inset-0 h-full w-full bg-black transition-opacity duration-700 ease-in-out ${
                interactionMode === 'telescope' ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none -z-10'
              }`}
            >
              <div className="absolute inset-0" style={{
                background: `radial-gradient(circle at 10% 20%, rgba(255,255,255,0.12) 0 1px, transparent 2px), radial-gradient(circle at 80% 40%, rgba(255,255,255,0.08) 0 1px, transparent 2px), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.1) 0 1px, transparent 2px)`,
                backgroundSize: '200px 200px'
              }} />
            </div>
          </>
        )}

        {/* Optional Scanline overlay for cyberpunk feel (toggle in settings) */}
        {interactionMode === 'chat' && scanlineOverlay && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
        )}

        {/* Foreground Layer: App Screens */}
        {currentPage === 'launcher' ? (
          <LauncherPage />
        ) : (
          <div className="relative flex flex-col h-full w-full z-10 pointer-events-none">
            {/* Header */}
            <div className="pointer-events-auto">
              <WorkspaceHeader />
            </div>

            {/* Main 3-panel container */}
            <div className="flex-1 flex w-full min-h-0 relative overflow-hidden" style={{ perspective: '1200px' }}>
              {/* Floating trigger when sidebar collapsed */}
              <div 
                className="transition-all duration-500 ease-in-out shrink-0 flex items-center"
                style={{
                  opacity: 1,
                  pointerEvents: 'auto'
                }}
              >
                <SidebarTrigger />
              </div>

              {/* Panel 1: Sidebar Left */}
              <div 
                className="overflow-hidden flex shrink-0"
                style={{
                  width: showLeft ? '260px' : '0px',
                  opacity: showLeft ? 1 : 0,
                  pointerEvents: showLeft ? 'auto' : 'none',
                  transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                  transformOrigin: 'left center',
                  transform: panelTransitionStyle === 'swing-3d'
                    ? (showLeft ? 'rotateY(0deg)' : 'rotateY(-90deg)')
                    : panelTransitionStyle === 'fade'
                    ? 'none'
                    : (showLeft ? 'translateX(0)' : 'translateX(-100%)')
                }}
              >
                <LeftPanel />
              </div>

              {/* Panel 2: Center (Interactive Globe viewports and Chats) */}
              <CenterPanel />

              {/* Panel 3: Context Right */}
              <div 
                className="overflow-hidden flex shrink-0"
                style={{
                  width: showRight ? '310px' : '0px',
                  opacity: showRight ? 1 : 0,
                  pointerEvents: showRight ? 'auto' : 'none',
                  transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                  transformOrigin: 'right center',
                  transform: panelTransitionStyle === 'swing-3d'
                    ? (showRight ? 'rotateY(0deg)' : 'rotateY(90deg)')
                    : panelTransitionStyle === 'fade'
                    ? 'none'
                    : (showRight ? 'translateX(0)' : 'translateX(100%)')
                }}
              >
                <RightPanel />
              </div>
            </div>

            {/* Settings Overlay Portal */}
            {currentPage === 'settings' && (
              <Suspense fallback={null}>
                <div className="pointer-events-auto absolute inset-0">
                  <SettingsPage />
                </div>
              </Suspense>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
