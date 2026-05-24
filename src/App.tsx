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
  
  // Custom customWallpaper / theme background styles
  const customWallpaper = useUIStore((s) => s.customWallpaper);

  // Background style overlay
  const backgroundStyle = customWallpaper
    ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  const showLeft = leftPanelOpen;
  const showRight = rightPanelOpen;

  return (
    <ErrorBoundary>
      <div 
        className="app-shell relative h-screen w-screen overflow-hidden text-text-main font-sans flex flex-col bg-bg-deep" 
        style={{ ...appStyle, ...backgroundStyle }}
      >
        {/* Background layer: Persistent Cesium Earth Map */}
        {!customWallpaper && (
          <>
            <CesiumBackground interactive={interactionMode === 'earth'} />
            <RenderEffectsOverlay />
          </>
        )}

        {/* Scanline overlay for cyberpunk feel */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />

        {/* Foreground Layer: App Screens */}
        {currentPage === 'launcher' ? (
          <LauncherPage />
        ) : (
          <div className="relative flex flex-col h-full w-full z-10">
            {/* Header */}
            <WorkspaceHeader />

            {/* Main 3-panel container */}
            <div className="flex-1 flex w-full min-h-0 relative overflow-hidden">
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
                className="transition-all duration-500 ease-in-out overflow-hidden flex shrink-0"
                style={{
                  width: showLeft ? '260px' : '0px',
                  opacity: showLeft ? 1 : 0,
                  transform: showLeft ? 'translateX(0)' : 'translateX(-20px)',
                  pointerEvents: showLeft ? 'auto' : 'none'
                }}
              >
                <LeftPanel />
              </div>

              {/* Panel 2: Center (Interactive Globe viewports and Chats) */}
              <CenterPanel />

              {/* Panel 3: Context Right */}
              <div 
                className="transition-all duration-500 ease-in-out overflow-hidden flex shrink-0"
                style={{
                  width: showRight ? '310px' : '0px',
                  opacity: showRight ? 1 : 0,
                  transform: showRight ? 'translateX(0)' : 'translateX(20px)',
                  pointerEvents: showRight ? 'auto' : 'none'
                }}
              >
                <RightPanel />
              </div>
            </div>

            {/* Settings Overlay Portal */}
            {currentPage === 'settings' && (
              <Suspense fallback={null}>
                <SettingsPage />
              </Suspense>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
