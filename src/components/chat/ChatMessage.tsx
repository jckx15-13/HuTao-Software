import { motion } from 'motion/react';
import { User, Bot } from 'lucide-react';
import { MarkdownMessage } from '../MarkdownMessage';

interface ChatMessageProps {
  sender: 'user' | 'ai' | 'system';
  content: string;
}

export function ChatMessage({ sender, content }: ChatMessageProps) {
  const isUser = sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-lg ${
        isUser
          ? 'bg-primary/20 border-primary/30 text-primary'
          : 'bg-white/5 border-white/10 text-white/40'
      }`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed backdrop-blur-md shadow-2xl ${
          isUser
            ? 'bg-primary/5 border border-primary/20 text-white/90'
            : 'bg-white/2 border border-white/10 text-white/80'
        }`}
      >
        <MarkdownMessage content={content} />
      </div>
    </motion.div>
  );
}
