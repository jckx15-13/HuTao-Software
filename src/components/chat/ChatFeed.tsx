import { useRef } from 'react';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import type { Message } from '../../lib/messages';
import { MessageBubble } from './MessageBubble';

interface ChatFeedProps {
  messages: Message[];
  isProcessing: boolean;
  isHighLoad: boolean;
  fontSize: number;
}

export function ChatFeed({ messages, isProcessing, isHighLoad, fontSize }: ChatFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useAutoScroll(scrollRef, [messages, isProcessing]);

  return (
    <div ref={scrollRef} className="relative z-10 flex-1 space-y-6 overflow-y-auto scroll-smooth p-4 sm:p-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} isHighLoad={isHighLoad} fontSize={fontSize} />
      ))}

      {isProcessing && (
        <div className="mt-2 flex w-full justify-start">
          <div className="flex items-center gap-3 p-4 text-sm text-text-muted">
            <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Thinking</span>
          </div>
        </div>
      )}
    </div>
  );
}
