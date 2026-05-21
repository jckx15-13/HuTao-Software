import React, { Suspense } from 'react';
import { MessageSquare, Globe2, Sparkles } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { ChatPanel } from '../ChatPanel';
import { ChatInputBar } from '../chat/ChatInputBar';
import { useAIChat } from '../../hooks/useAIChat';

const GoogleEarthRemix = React.lazy(() => import('../learning/GoogleEarthRemix'));

export function CenterPanel() {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const isProcessing = useUIStore((s) => s.isProcessing);
  
  const { sendMessage } = useAIChat();

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden relative">
      {/* Dynamic Segmented Mode Switcher (Pill Style) */}
      <div className="absolute top-3 left-1/2 z-20 -translate-x-1/2">
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
            onClick={() => setInteractionMode('earth')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full tracking-wider transition-all cursor-pointer ${
              interactionMode === 'earth' ? 'bg-primary text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Globe2 className="h-3 w-3" />
            <span>Earth</span>
          </button>
        </div>
      </div>

      {/* Center Panel Content */}
      {interactionMode === 'chat' ? (
        <div className="flex-1 w-full flex flex-col pt-12 relative overflow-hidden">
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

            {/* Input bar */}
            <ChatInputBar onSend={sendMessage} disabled={isProcessing} />
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col relative overflow-hidden">
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-30">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary animate-pulse">
                  Syncing Earth Interface...
                </span>
              </div>
            </div>
          }>
            <GoogleEarthRemix />
          </Suspense>
        </div>
      )}
    </div>
  );
}

