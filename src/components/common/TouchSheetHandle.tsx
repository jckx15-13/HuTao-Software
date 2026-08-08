import React, { useRef } from 'react';
import { useTouchInput } from '@/hooks/useTouchInput';

interface TouchSheetHandleProps {
  onDismiss?: () => void;
  onExpand?: () => void;
  title?: string;
  className?: string;
}

export function TouchSheetHandle({ onDismiss, onExpand, title, className = '' }: TouchSheetHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);

  useTouchInput({
    targetRef: handleRef,
    onSwipe: (dir) => {
      if (dir === 'down') {
        onDismiss?.();
      } else if (dir === 'up') {
        onExpand?.();
      }
    }
  });

  return (
    <div
      ref={handleRef}
      className={`flex flex-col items-center justify-center py-2 px-4 cursor-grab active:cursor-grabbing select-none touch-none w-full min-h-[44px] ${className}`}
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onDismiss?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Drag sheet handle"
    >
      <div className="w-12 h-1.5 rounded-full bg-white/30 hover:bg-primary/80 transition-colors shadow-sm" />
      {title && <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 mt-1">{title}</span>}
    </div>
  );
}
