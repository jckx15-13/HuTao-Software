import { useRef, useEffect } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { Message } from '../../lib/messages';
import { MessageBubble } from './MessageBubble';

interface ChatFeedProps {
  messages: Message[];
  isProcessing: boolean;
  isHighLoad: boolean;
  fontSize: number;
}

export function ChatFeed({ messages, isProcessing, isHighLoad, fontSize }: ChatFeedProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Auto-scroll logic handled by Virtuoso's followOutput prop, 
  // but we also trigger it on data length changes for reliability.
  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  return (
    <div className="relative z-10 flex-1 overflow-hidden">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        followOutput="auto"
        className="scroller h-full"
        itemContent={(_index, message) => (
          <div className="px-4 py-3 sm:px-6">
            <MessageBubble message={message} isHighLoad={isHighLoad} fontSize={fontSize} />
          </div>
        )}
        components={{
          Footer: () => isProcessing ? (
            <div className="px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3 p-4 text-sm text-text-muted">
                <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Thinking</span>
              </div>
            </div>
          ) : <div className="h-6" />
        }}
      />
    </div>
  );
}
