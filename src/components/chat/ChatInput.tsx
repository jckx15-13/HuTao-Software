import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className="px-6 pb-6 pt-2">
      <div className="relative bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-2xl">
        <textarea 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="Transmit data..." 
          className="w-full bg-transparent p-3 pr-12 text-sm text-white/90 outline-none resize-none min-h-[48px] max-h-32 placeholder:text-white/20" 
        />
        <button 
          onClick={handleSend} 
          disabled={!input.trim() || disabled}
          className="absolute right-3 bottom-3 p-2 rounded-xl bg-primary/80 text-white disabled:opacity-10 transition-all hover:bg-primary hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
        >
          <Send size={16} />
        </button>
      </div>
    </footer>
  );
}
