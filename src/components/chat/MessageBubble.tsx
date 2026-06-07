import { User, Bot, Brain, Check, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useUIStore } from '../../store/uiStore';
import type { Message } from '../../lib/messages';
import { MarkdownMessage } from '../MarkdownMessage';
import { TypewriterText } from './TypewriterText';
import { useMemoryPush } from '../../hooks/ai/useMemoryPush';

interface MessageBubbleProps {
  message: Message;
  isHighLoad: boolean;
  fontSize: number;
}

export function MessageBubble({ message, isHighLoad, fontSize }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const { pushToMemory, isPushing, isPushed } = useMemoryPush();

  const { chatBubbleStyle = 'glass', iconStyle = 'outlined' } = useUIStore((s) => s.personalisation) || {};

  // Icon styling based on iconStyle and sender
  const iconBaseClass = `h-7 w-7 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all ${
    iconStyle === 'filled'
      ? isUser
        ? 'bg-primary text-white border-none'
        : 'bg-white/15 text-white border-none'
      : isUser
        ? 'bg-primary/20 border border-primary/30 text-primary'
        : 'bg-white/5 border border-white/10 text-white/40'
  }`;

  // Bubble styling based on chatBubbleStyle and sender
  let bubbleClass = 'relative w-full max-w-[85%] px-4 py-2.5 text-xs leading-relaxed transition-all ';
  if (isSystem) {
    bubbleClass = 'relative w-full max-w-full rounded-lg border border-danger/40 bg-danger/20 p-4 font-mono text-xs text-danger shadow-sm ';
  } else if (chatBubbleStyle === 'glass') {
    bubbleClass += isUser
      ? 'bg-primary/10 border border-primary/25 text-white/90 backdrop-blur-md shadow-lg shadow-primary/5 rounded-2xl rounded-tr-sm'
      : 'bg-white/5 border border-white/10 text-white/80 backdrop-blur-md shadow-lg rounded-2xl rounded-tl-sm';
  } else if (chatBubbleStyle === 'solid') {
    bubbleClass += isUser
      ? 'bg-primary text-primary-text border border-primary-hover shadow-md rounded-2xl rounded-tr-sm'
      : 'bg-panel border border-panel-border text-text-main shadow-md rounded-2xl rounded-tl-sm';
  } else {
    // minimal
    bubbleClass += isUser
      ? 'bg-transparent border-r-2 border-primary text-white/90 rounded-none px-3 py-1 shadow-none'
      : 'bg-transparent border-l-2 border-white/20 text-white/80 rounded-none px-3 py-1 shadow-none';
  }

  return (
    <div className={`group flex w-full gap-3 items-start ${isUser ? 'flex-row-reverse' : 'justify-start'}`}>
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
        {isUser && <div className="whitespace-pre-wrap">{message.content}</div>}
        {isSystem && <TypewriterText content={message.content} isFast={isHighLoad} />}
        {!isUser && !isSystem && (
          <div className="ai-markdown-content space-y-4 text-text-main">
            <MarkdownMessage content={message.content} />
          </div>
        )}
      </div>

      {/* --- Action Buttons (Visible on hover) --- */}
      {!isSystem && (
        <motion.div 
          initial={{ opacity: 0, x: isUser ? 5 : -5 }}
          whileInView={{ opacity: 1, x: 0 }}
          className={`flex flex-col gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'mr-1' : 'ml-1'}`}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => pushToMemory(message.content, message.sender)}
            disabled={isPushing || isPushed}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isPushed 
                ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                : 'bg-white/5 border-white/10 text-white/30 hover:text-white/60 hover:bg-white/10'
            }`}
            title={isPushed ? "Knowledge Secure" : "Push to Neural Memory"}
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
}
