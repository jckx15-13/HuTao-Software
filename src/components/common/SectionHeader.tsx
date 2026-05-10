import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, eyebrow, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
            {eyebrow}
          </div>
        )}
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-primary">{title}</h3>
      </div>
      {action}
    </div>
  );
}
