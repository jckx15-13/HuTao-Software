import { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Lock, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatComposerProps {
  disabled: boolean;
  fontSize: number;
  onSubmit: (text: string) => Promise<void>;
}

export function ChatComposer({ disabled, fontSize, onSubmit }: ChatComposerProps) {
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
    <div className="relative z-20 shrink-0 bg-gradient-to-t from-background/85 via-background/45 to-transparent px-4 pb-5 pt-3 sm:px-6">
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
          className="flex-1 resize-none bg-transparent px-3 py-2 font-sans leading-relaxed text-text-main outline-none placeholder:text-text-muted/60 caret-primary/80"
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
