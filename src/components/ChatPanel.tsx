import { useRef, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { ChatMessage } from './chat/ChatMessage';

export function ChatPanel() {
  // Directly pull messages from the active session via store
  const messages = useUIStore((s) => s.messages);
  const isProcessing = useUIStore((s) => s.isProcessing);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full w-full flex-col bg-transparent font-sans">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth scroller">
        {messages.map((m) => (
          <ChatMessage key={m.id} sender={m.sender} content={m.content} />
        ))}
        {isProcessing && (
          <div className="flex gap-4 animate-pulse px-4">
            <div className="h-7 w-7 rounded-lg bg-white/10" />
            <div className="h-10 w-24 rounded-2xl bg-white/5" />
          </div>
        )}
      </div>
    </div>
  );
}
