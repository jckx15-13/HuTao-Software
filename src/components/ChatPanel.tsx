import { memo, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Bot, Brain, Check, Lock, Maximize2, RefreshCw, Send, TerminalSquare, Trash2, User } from 'lucide-react';
import { motion, useAnimation } from 'motion/react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { IconButton } from './common/IconButton';
import { MarkdownMessage } from './MarkdownMessage';
import { useMemoryPush } from '../hooks/ai/useMemoryPush';
import { useAIChat } from '../hooks/useAIChat';
import { useAudioFeedback } from '../hooks/useAudioFeedback';
import { useChatPersistence } from '../hooks/useChatPersistence';
import type { Message } from '../lib/messages';
import { useUIStore } from '../store/uiStore';

export function ChatPanel() {
  const messages = useUIStore((state) => state.messages);
  const isProcessing = useUIStore((state) => state.isProcessing);
  const cpuLoad = useUIStore((state) => state.cpuLoad);
  const clearMessages = useUIStore((state) => state.clearMessages);
  const setMessages = useUIStore((state) => state.setMessages);
  const terminalFontSize = useUIStore((state) => state.terminalFontSize);
  const lastAnnouncedMessageIdRef = useRef<string | null>(null);

  const { sendMessage } = useAIChat();
  const { playClick, playBlip } = useAudioFeedback();
  const paneControls = useAnimation();
  const isHighLoad = cpuLoad > 0.8;

  useChatPersistence(messages, setMessages);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage &&
      lastMessage.sender !== 'user' &&
      lastMessage.id !== lastAnnouncedMessageIdRef.current
    ) {
      lastAnnouncedMessageIdRef.current = lastMessage.id;
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
    void paneControls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } });

    await sendMessage(text);
  };

  return (
    <motion.div className="flex h-full w-full flex-col overflow-hidden bg-transparent" animate={paneControls}>
      <ChatHeader onClear={clearMessages} />
      <ChatFeed
        messages={messages}
        isProcessing={isProcessing}
        fontSize={terminalFontSize}
      />
      <ChatComposer disabled={isProcessing} fontSize={terminalFontSize} onSubmit={handleSend} />
    </motion.div>
  );
}

interface ChatHeaderProps {
  onClear: () => void;
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    return;
  }

  await document.exitFullscreen();
}

function ChatHeader({ onClear }: ChatHeaderProps) {
  return (
    <header className="panel-glass relative z-chrome flex h-16 shrink-0 items-center justify-between border-b border-primary/15 bg-gradient-to-r from-panel/85 via-panel/65 to-background/30 px-5 shadow-[0_12px_30px_color-mix(in_srgb,var(--theme-primary)_8%,transparent)]">
      <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest text-primary">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10 shadow-[0_0_18px_color-mix(in_srgb,var(--theme-primary)_18%,transparent)]">
          <TerminalSquare className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span>Chat</span>
          <span className="mt-1 text-[11px] font-medium tracking-[0.14em] text-text-muted/70">AI workspace</span>
        </div>
      </div>

      <div className="flex gap-2">
        <IconButton
          icon={Maximize2}
          label="Toggle fullscreen"
          onClick={() => toggleFullscreen().catch(() => undefined)}
        />
        <IconButton icon={Trash2} label="Clear chat" onClick={onClear} variant="danger" />
      </div>
    </header>
  );
}

interface ChatFeedProps {
  messages: Message[];
  isProcessing: boolean;
  fontSize: number;
}

function ChatFeed({ messages, isProcessing, fontSize }: ChatFeedProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (!virtuosoRef.current || messages.length === 0) return;

    virtuosoRef.current.scrollToIndex({
      index: messages.length - 1,
      behavior: 'smooth',
    });
  }, [messages.length]);

  return (
    <div className="relative z-content flex-1 overflow-hidden">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        computeItemKey={(_index, message) => message.id}
        followOutput="auto"
        className="scroller h-full"
        itemContent={(_index, message) => (
          <div className="px-4 py-3 sm:px-6">
            <MessageBubble message={message} fontSize={fontSize} />
          </div>
        )}
        components={{
          Footer: () =>
            isProcessing ? (
              <div className="px-4 py-3 sm:px-6">
                <div className="panel-glass inline-flex items-center gap-3 rounded-full border border-primary/15 bg-panel/70 px-4 py-3 text-sm text-text-muted shadow-[0_0_22px_color-mix(in_srgb,var(--theme-primary)_8%,transparent)]">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary/60" />
                  <span className="font-mono text-[11px] uppercase tracking-wider">Thinking</span>
                </div>
              </div>
            ) : (
              <div className="h-6" />
            ),
        }}
      />
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  fontSize: number;
}

const MessageBubble = memo(function MessageBubble({ message, fontSize }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const { pushToMemory, isPushing, isPushed } = useMemoryPush();
  const { chatBubbleStyle = 'glass', iconStyle = 'outlined' } = useUIStore((s) => s.personalisation) || {};

  const iconBaseClass = `h-7 w-7 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all ${
    iconStyle === 'filled'
      ? isUser
        ? 'bg-primary text-white border-none'
        : 'bg-white/15 text-white border-none'
      : isUser
        ? 'bg-primary/20 border border-primary/30 text-primary'
        : 'bg-white/5 border border-white/10 text-white/40'
  }`;

  let bubbleClass = 'relative min-w-0 max-w-[calc(100%-5rem)] px-4 py-2.5 text-xs leading-relaxed transition-all ';
  if (isSystem) {
    bubbleClass =
      'relative min-w-0 max-w-[calc(100%-5rem)] rounded-2xl border border-white/10 bg-panel/85 px-3 py-2 font-mono text-[11px] leading-relaxed text-text-muted shadow-sm ';
  } else if (chatBubbleStyle === 'glass') {
    bubbleClass += isUser
      ? 'bg-primary/10 border border-primary/25 text-white/90 backdrop-blur-md shadow-lg shadow-primary/5 rounded-2xl rounded-tr-sm'
      : 'bg-white/5 border border-white/10 text-white/80 backdrop-blur-md shadow-lg rounded-2xl rounded-tl-sm';
  } else if (chatBubbleStyle === 'solid') {
    bubbleClass += isUser
      ? 'bg-primary text-primary-text border border-primary-hover shadow-md rounded-2xl rounded-tr-sm'
      : 'bg-panel border border-panel-border text-text-main shadow-md rounded-2xl rounded-tl-sm';
  } else {
    bubbleClass += isUser
      ? 'bg-transparent border-r-2 border-primary text-white/90 rounded-none px-3 py-1 shadow-none'
      : 'bg-transparent border-l-2 border-white/20 text-white/80 rounded-none px-3 py-1 shadow-none';
  }

  return (
    <div className={`group flex w-full items-start gap-3 ${isUser ? 'flex-row-reverse' : 'justify-start'}`}>
      {!isSystem && (
        <div className={iconBaseClass}>
          {isUser ? (
            <User size={12} className={iconStyle === 'filled' ? 'fill-current' : ''} />
          ) : (
            <Bot size={12} className={iconStyle === 'filled' ? 'fill-current' : ''} />
          )}
        </div>
      )}

      <div className={bubbleClass} style={{ fontSize: isSystem ? undefined : fontSize }}>
        {(isUser || isSystem) && <div className="whitespace-pre-wrap">{message.content}</div>}
        {!isUser && !isSystem && (
          <div className="ai-markdown-content space-y-4 text-text-main">
            <MarkdownMessage content={message.content} />
          </div>
        )}
      </div>

      {!isSystem && (
        <motion.div
          initial={{ opacity: 0, x: isUser ? 5 : -5 }}
          whileInView={{ opacity: 1, x: 0 }}
          className={`mt-1 flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${isUser ? 'mr-1' : 'ml-1'}`}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => pushToMemory(message.content, message.sender)}
            disabled={isPushing || isPushed}
            aria-label={isPushed ? 'Stored in local memory' : 'Push message to local memory'}
            className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border transition-all ${
              isPushed
                ? 'border-green-500/40 bg-green-500/20 text-green-400'
                : 'border-white/10 bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60'
            }`}
            title={isPushed ? 'Stored in local memory' : 'Push to local memory'}
          >
            {isPushing ? (
              <RefreshCw size={11} className="animate-spin" />
            ) : isPushed ? (
              <Check size={11} />
            ) : (
              <Brain size={11} />
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
});

interface ChatComposerProps {
  disabled: boolean;
  fontSize: number;
  onSubmit: (text: string) => Promise<void>;
}

function ChatComposer({ disabled, fontSize, onSubmit }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSend = input.trim().length > 0 && !disabled && !isSubmitting;

  const submit = async () => {
    if (!canSend) return;

    setIsSubmitting(true);
    try {
      await onSubmit(input.trim());
      setInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-chrome shrink-0 bg-gradient-to-t from-background/85 via-background/45 to-transparent px-4 pb-5 pt-3 sm:px-6">
      <motion.div className="panel-glass relative flex flex-col gap-2 overflow-hidden rounded-[28px] border border-primary/25 bg-panel/78 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.35),0_0_24px_color-mix(in_srgb,var(--theme-primary)_10%,transparent)_inset] transition-all focus-within:border-primary/60 focus-within:shadow-[0_18px_45px_rgba(0,0,0,0.35),0_0_30px_color-mix(in_srgb,var(--theme-primary)_18%,transparent)_inset]">
        <TextareaAutosize
          minRows={1}
          maxRows={8}
          aria-label="Message Silver Wolf VI"
          placeholder="Message Silver Wolf VI..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          className="flex-1 resize-none bg-transparent px-3 py-2 font-sans leading-relaxed text-text-main caret-primary/80 outline-none placeholder:text-text-muted/60"
          style={{ fontSize, cursor: 'text' }}
        />
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary/75">
            <Lock className="h-3 w-3" />
            <span>Local session</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              void submit();
            }}
            disabled={!canSend}
            aria-label="Send message"
            title="Send message"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-primary/45 bg-primary/25 text-primary shadow-[0_0_18px_color-mix(in_srgb,var(--theme-primary)_24%,transparent)] transition-colors hover:bg-primary hover:text-primary-text disabled:pointer-events-none disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
      <div className="mt-3 text-center font-mono text-[11px] uppercase tracking-wider text-text-muted/65">
        AI generated content may be inaccurate.
      </div>
    </div>
  );
}
