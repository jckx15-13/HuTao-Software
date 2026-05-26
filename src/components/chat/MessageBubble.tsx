import type { Message } from '../../lib/messages';
import { MarkdownMessage } from '../MarkdownMessage';
import { TypewriterText } from './TypewriterText';

interface MessageBubbleProps {
  message: Message;
  isHighLoad: boolean;
  fontSize: number;
}

const bubbleBaseClass = 'relative w-full max-w-full leading-relaxed';

export function MessageBubble({ message, isHighLoad, fontSize }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  const bubbleClass = [
    bubbleBaseClass,
    isUser && 'max-w-[85%] rounded-lg border border-panel-border bg-panel px-4 py-3 text-text-main shadow-sm',
    isSystem && 'rounded-lg border border-danger/40 bg-danger/20 p-4 font-mono text-sm text-danger shadow-sm',
    !isUser && !isSystem && 'bg-transparent pt-1 font-sans text-text-main',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`group flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={bubbleClass} style={{ fontSize: isSystem ? undefined : fontSize }}>
        {isUser && <div className="whitespace-pre-wrap">{message.content}</div>}
        {isSystem && <TypewriterText content={message.content} isFast={isHighLoad} />}
        {!isUser && !isSystem && (
          <div className="ai-markdown-content space-y-4 text-text-main">
            <MarkdownMessage content={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}
