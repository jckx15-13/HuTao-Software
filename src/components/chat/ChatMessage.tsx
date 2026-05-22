import { User, Bot } from 'lucide-react';
import { MarkdownMessage } from '../MarkdownMessage';
import { useUIStore } from '../../store/uiStore';

interface ChatMessageProps {
  sender: 'user' | 'ai' | 'system' | 'assistant';
  content: string;
  key?: any;
}

export function ChatMessage({ sender, content }: ChatMessageProps) {
  const isUser = sender === 'user';
  const { chatBubbleStyle, iconStyle } = useUIStore((s) => s.personalisation);

  // Icon styling based on iconStyle and sender
  const iconBaseClass = `h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all ${
    iconStyle === 'filled'
      ? isUser
        ? 'bg-primary text-white border-none'
        : 'bg-white/15 text-white border-none'
      : isUser
        ? 'bg-primary/20 border border-primary/30 text-primary'
        : 'bg-white/5 border border-white/10 text-white/40'
  }`;

  // Bubble styling based on chatBubbleStyle and sender
  let bubbleClass = 'max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed transition-all ';
  if (chatBubbleStyle === 'glass') {
    bubbleClass += isUser
      ? 'bg-primary/10 border border-primary/25 text-white/90 backdrop-blur-md shadow-lg shadow-primary/5'
      : 'bg-white/5 border border-white/10 text-white/80 backdrop-blur-md shadow-lg';
  } else if (chatBubbleStyle === 'solid') {
    bubbleClass += isUser
      ? 'bg-primary text-white border border-primary-hover shadow-md'
      : 'bg-[#151720] border border-[#252836] text-white/90 shadow-md';
  } else {
    // minimal
    bubbleClass += isUser
      ? 'bg-transparent border-r-2 border-primary text-white/90 rounded-none px-3 py-1 shadow-none'
      : 'bg-transparent border-l-2 border-white/20 text-white/80 rounded-none px-3 py-1 shadow-none';
  }

  return (
    <div className={`message-enter flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={iconBaseClass}>
        {isUser ? <User size={14} className={iconStyle === 'filled' ? 'fill-current' : ''} /> : <Bot size={14} className={iconStyle === 'filled' ? 'fill-current' : ''} />}
      </div>
      <div className={bubbleClass}>
        <MarkdownMessage content={content} />
      </div>
    </div>
  );
}
