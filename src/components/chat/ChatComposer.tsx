import { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Lock, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatComposerProps {
  disabled: boolean;
  fontSize: number;
  onSubmit: (text: string) => void;
}

export function ChatComposer({ disabled, fontSize, onSubmit }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const canSend = input.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;

    onSubmit(input.trim());
    setInput('');
  };

  return (
    <div className="relative z-20 shrink-0 bg-transparent px-3 pb-4 pt-2 sm:px-4">
      <motion.div className="relative flex flex-col gap-2 rounded-lg border border-primary/20 bg-panel/80 p-3 shadow-[0_0_15px_color-mix(in_srgb,var(--theme-primary)_5%,transparent)_inset] transition-all panel-glass focus-within:border-primary/60 focus-within:shadow-[0_0_20px_color-mix(in_srgb,var(--theme-primary)_15%,transparent)_inset]">
        <TextareaAutosize
          minRows={1}
          maxRows={8}
          placeholder="Message Silver Wolf VI..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className="flex-1 resize-none bg-transparent px-1 font-sans leading-relaxed text-text-main outline-none placeholder:text-text-muted/60 caret-primary/80"
          style={{ fontSize, cursor: 'text' }}
        />
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-widest text-primary/70">
            <Lock className="h-3 w-3" />
            <span>Local session</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            title="Send message"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/20 text-primary shadow-[0_0_10px_color-mix(in_srgb,var(--theme-primary)_20%,transparent)] transition-colors hover:bg-primary hover:text-primary-text disabled:pointer-events-none disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
      <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-text-muted/50">
        AI generated content may be inaccurate.
      </div>
    </div>
  );
}
