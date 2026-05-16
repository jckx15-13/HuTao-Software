import { useRef, useEffect } from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import { useAIChat } from '../hooks/useAIChat';
import { useUIStore } from '../store/uiStore';
import { ChatMessage } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';

export function ChatPanel() {
  const messages = useUIStore((s) => s.messages);
  const isProcessing = useUIStore((s) => s.isProcessing);
  const clearMessages = useUIStore((s) => s.clearMessages);
  const { sendMessage } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full w-full flex-col bg-transparent font-sans">
      <header className="flex h-12 items-center justify-between px-6 border-b border-white/5 bg-white/2">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles size={16} className="glow-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Neural Interface</span>
        </div>
        <button onClick={clearMessages} className="text-white/20 hover:text-red-400 transition-colors">
          <Trash2 size={16} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth scroller">
        {messages.map((m) => (
          <ChatMessage key={m.id} sender={m.sender} content={m.content} />
        ))}
        {isProcessing && (
          <div className="flex gap-4 animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-white/10" />
            <div className="h-10 w-24 rounded-2xl bg-white/5" />
          </div>
        )}
      </div>

      <ChatInput onSend={sendMessage} disabled={isProcessing} />
    </div>
  );
}
