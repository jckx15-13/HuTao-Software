import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';

interface FileTreeSectionProps {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  itemCount?: number;
  children: ReactNode;
}

export function FileTreeSection({ title, icon: Icon, defaultOpen = false, itemCount, children }: FileTreeSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col select-none">
      {/* Header Row */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-7 w-full items-center justify-between px-2 text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors text-[9px] font-mono uppercase tracking-widest font-bold"
      >
        <div className="flex items-center gap-1.5">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Icon className="h-3.5 w-3.5 text-primary" />
          <span>{title}</span>
        </div>
        {itemCount !== undefined && itemCount > 0 && (
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] text-white/50">{itemCount}</span>
        )}
      </button>

      {/* Children Row */}
      {isOpen && (
        <div className="flex flex-col border-l border-white/5 ml-3.5 pl-1.5 mt-0.5 mb-1.5">
          {children}
        </div>
      )}
    </div>
  );
}

interface TreeItemProps {
  label: string;
  icon?: LucideIcon;
  depth?: number;
  selected?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

export function TreeItem({ label, icon: Icon, depth = 0, selected = false, onClick, badge }: TreeItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-full items-center justify-between rounded px-2 text-[11px] font-mono text-white/60 hover:bg-white/5 hover:text-white/90 transition-all select-none cursor-pointer ${
        selected ? 'bg-primary/15 text-primary border-l-2 border-primary font-bold' : ''
      }`}
      style={{ paddingLeft: `${depth * 8 + 8}px` }}
    >
      <div className="flex items-center gap-2 truncate">
        {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${selected ? 'text-primary' : 'text-white/30'}`} />}
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && (
        <span className={`rounded px-1 text-[8px] ${selected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
