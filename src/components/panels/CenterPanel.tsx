import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { MessageSquare, Globe2, Sparkles, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { ChatPanel } from '../ChatPanel';
import { useAIChat } from '../../hooks/useAIChat';
import GoogleEarthRemix from '../learning/GoogleEarthRemix';
import WorldWideTelescopeView from '../learning/WorldWideTelescopeView';
import { ErrorBoundary } from '../ErrorBoundary';


function SidebarTrigger() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);
  const interactionMode = useUIStore((s) => s.interactionMode);

  if (leftPanelOpen) return null;

  const isOrbital = interactionMode === 'orbital';

  return (
    <button
      type="button"
      onClick={() => setLeftPanelOpen(true)}
      className={`absolute top-1/2 left-0 -translate-y-1/2 z-20 flex h-14 w-5 items-center justify-center rounded-r-lg bg-black/40 hover:bg-black/60 border-y border-r border-white/10 hover:border-white/20 text-white/40 hover:text-white/80 cursor-pointer group shadow-lg transition-all duration-300 ease-out pointer-events-auto ${
        isOrbital ? 'opacity-0 pointer-events-none -translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      title="Expand Sidebar"
    >
      <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export function CenterPanel() {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const isProcessing = useUIStore((s) => s.isProcessing);
  
  const { sendMessage } = useAIChat();

  // Track WWT error state for change log reporting
  const handleTelescopeError = useCallback((error: Error) => {
    console.warn('[CenterPanel] Telescope view error caught by boundary:', error.message);
    useUIStore.getState().addChangeLog(
      'TELESCOPE',
      `View error caught: ${error.message}`,
      'warning'
    );
  }, []);

  // Keyboard shortcut: Escape exits telescope mode back to orbital
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && interactionMode === 'telescope') {
        setInteractionMode('orbital');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactionMode, setInteractionMode]);

  const isSpaceMode = interactionMode === 'orbital';

  return (
    // Root container: ALWAYS pointer-events-none to let Cesium globe receive drags underneath.
    // Each interactive child explicitly opts-in with pointer-events-auto.
    <div className="flex h-full flex-1 flex-col overflow-hidden relative pointer-events-none">
      
      {/* Sidebar trigger — always interactive */}
      <SidebarTrigger />

      {/* Dynamic Segmented Mode Switcher (Pill Style) — always interactive */}
      <div className="absolute top-[18px] left-1/2 z-30 -translate-x-1/2 pointer-events-auto">
        <div className="glass-panel flex items-center p-1 rounded-full border border-white/5 shadow-lg">
          <button
            type="button"
            onClick={() => setInteractionMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full tracking-wider transition-all cursor-pointer ${
              interactionMode === 'chat' ? 'bg-primary text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <MessageSquare className="h-3 w-3" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setInteractionMode('orbital')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full tracking-wider transition-all cursor-pointer ${
              interactionMode === 'orbital' ? 'bg-primary text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Globe2 className="h-3 w-3" />
            <span>Space</span>
          </button>
        </div>
      </div>

      {/* Center Panel Content with Slide Transitions */}
      <div className="flex-1 w-full relative overflow-hidden">
        {/* Chat View Container */}
        <div 
          className={`absolute inset-0 flex flex-col pt-12 transition-all duration-300 ease-out ${
            interactionMode === 'chat' 
              ? 'translate-x-0 opacity-100 pointer-events-auto z-10' 
              : '-translate-x-full opacity-0 pointer-events-none z-0'
          }`}
        >
          <div className="flex-1 w-full flex flex-col justify-between overflow-hidden">
            {/* Header Neural Indicator */}
            <div className="flex h-8 shrink-0 items-center justify-between px-6 border-b border-white/5 bg-black/10">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-3.5 w-3.5 glow-pulse" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.25em]">Neural Interface active</span>
              </div>
            </div>

            {/* Scrollable messages */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel />
            </div>

            {/* Input bar removed to prevent duplication (ChatPanel manages its own) */}
          </div>
        </div>

        {/* Combined Space & Telescope Viewport Container */}
        <div 
          className={`absolute inset-0 transition-all duration-300 ease-out ${
            isSpaceMode
              ? 'translate-x-0 opacity-100 z-10' 
              : 'translate-x-full opacity-0 pointer-events-none z-0'
          }`}
        >
          {/* WorldWide Telescope controls overlay — wrapped in inline ErrorBoundary for graceful degradation */}
          {isSpaceMode && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <ErrorBoundary
                variant="inline"
                fallbackMessage="Telescope Controls Error"
                onError={handleTelescopeError}
              >
                <WorldWideTelescopeView controlsOnly />
              </ErrorBoundary>
            </div>
          )}

          {/* GoogleEarthRemix overlay — pointer-events-none so globe underneath gets drags */}
          {isSpaceMode && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <GoogleEarthRemix />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
