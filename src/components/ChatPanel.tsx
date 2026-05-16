import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { ChatComposer } from './chat/ChatComposer';
import { ChatFeed } from './chat/ChatFeed';
import { ChatHeader } from './chat/ChatHeader';
import { useAIChat } from '../hooks/useAIChat';
import { useAudioFeedback } from '../hooks/useAudioFeedback';
import { useChatPersistence } from '../hooks/useChatPersistence';
import { useUIStore } from '../store/uiStore';

export function ChatPanel() {
  const messages = useUIStore((state) => state.messages);
  const isProcessing = useUIStore((state) => state.isProcessing);
  const cpuLoad = useUIStore((state) => state.cpuLoad);
  const clearMessages = useUIStore((state) => state.clearMessages);
  const setMessages = useUIStore((state) => state.setMessages);
  const terminalFontSize = useUIStore((state) => state.terminalFontSize);
  const { sendMessage } = useAIChat();
  const { playClick, playBlip } = useAudioFeedback();
  const paneControls = useAnimation();
  const isHighLoad = cpuLoad > 0.8;
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useChatPersistence(messages, setMessages);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.sender !== 'user') {
      playBlip();
    }
  }, [messages, playBlip]);

  const handleSend = async (text: string) => {
    if (isProcessing) return;

    playClick();

    await paneControls.start({
      y: isHighLoad ? 1 : 2,
      transition: { type: 'spring', stiffness: 1000, damping: 10 },
    });
    paneControls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } });

    sendMessage(text);
  };

  const handleClear = useCallback(() => {
    // Only show confirmation when there are actual user/AI messages beyond the initial system messages
    const hasContent = messages.some((m) => m.sender === 'user');
    if (hasContent) {
      setShowClearConfirm(true);
    } else {
      clearMessages();
    }
  }, [messages, clearMessages]);

  const confirmClear = useCallback(() => {
    clearMessages();
    setShowClearConfirm(false);
  }, [clearMessages]);

  return (
    <motion.div className="flex h-full w-full flex-col overflow-hidden bg-transparent" animate={paneControls}>
      <ChatHeader onClear={handleClear} />
      <ChatFeed
        messages={messages}
        isProcessing={isProcessing}
        isHighLoad={isHighLoad}
        fontSize={terminalFontSize}
      />
      <ChatComposer disabled={isProcessing} fontSize={terminalFontSize} onSubmit={handleSend} />

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-danger/30 bg-panel/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] panel-glass">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-danger">
              Clear Chat History
            </h3>
            <p className="mt-3 text-sm text-text-muted leading-relaxed">
              This will permanently erase all messages in this session. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg border border-panel-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:bg-panel hover:text-text-main"
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                className="rounded-lg border border-danger/40 bg-danger/15 px-4 py-2 font-mono text-xs uppercase tracking-widest text-danger transition-colors hover:bg-danger/30"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
