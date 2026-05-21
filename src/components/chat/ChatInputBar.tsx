import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Paperclip, Mic, Send } from 'lucide-react';

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInputBar({ onSend, disabled, placeholder = 'Ask Silver Wolf anything...' }: ChatInputBarProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow height of textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative w-full px-6 pb-6">
      <div className="glass-panel flex items-end gap-2 p-2 focus-within:ring-1 focus-within:ring-primary/45 transition-all">
        {/* Attachment button */}
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors"
          title="Upload file"
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Text Input area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent py-2.5 px-1 text-sm text-text-main focus:outline-none max-h-40 scroller"
          style={{ minHeight: '36px' }}
        />

        {/* Action button group */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors"
            title="Voice input"
            disabled={disabled}
          >
            <Mic className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:bg-white/5 disabled:text-white/20 transition-all cursor-pointer"
            title="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
