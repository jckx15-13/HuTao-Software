import { useState } from 'react';
import {
  Hexagon,
  ChevronLeft,
  Search,
  FolderOpen,
  Image,
  FileText,
  Bookmark,
  User,
  Settings,
  Flame,
  BookOpen,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { FileTreeSection, TreeItem } from './FileTreeSection';
import { ChatSessionList } from './ChatSessionList';

export function LeftPanel() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);
  const setCurrentPage = useUIStore((s) => s.setCurrentPage);
  const activeLocation = useUIStore((s) => s.activeLocation);
  
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <aside className="glass-panel flex h-full w-[260px] flex-col border-r border-white/5 select-none" style={{ borderRadius: 0 }}>
      {/* Header section */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Hexagon className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/90">
            SILVER WOLF
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLeftPanelOpen(false)}
          className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Main scrolling content area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scroller">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces..."
            className="w-full rounded-lg bg-white/5 py-2 pl-8 pr-3 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary/35 placeholder:text-white/20 transition-all font-mono"
          />
        </div>

        {/* Tools Section */}
        <div className="space-y-1">
          <FileTreeSection title="Neural Library" icon={FolderOpen} defaultOpen={true}>
            <TreeItem label="Media Assets" icon={Image} badge={0} />
            <TreeItem label="Uploaded Documents" icon={FileText} badge={0} />
            <TreeItem label="Saved Snippets" icon={Bookmark} badge={0} />
          </FileTreeSection>
        </div>

        {/* Selected Location context indicator */}
        {activeLocation && (
          <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider">
              <Flame className="h-3.5 w-3.5" />
              <span>Target Pointed</span>
            </div>
            <div className="mt-1 text-white/80 font-bold">{activeLocation.name}</div>
            <div className="text-white/40 mt-0.5">{activeLocation.country}</div>
          </div>
        )}

        {/* Chats Section */}
        <div className="pt-2 border-t border-white/5">
          <ChatSessionList />
        </div>
      </div>

      {/* Bottom Profile and Settings bar */}
      <div className="mt-auto flex h-14 items-center justify-between border-t border-white/5 px-4 bg-black/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col font-mono">
            <span className="text-[10px] font-bold text-white/80 leading-none">OPERATOR</span>
            <span className="text-[8px] text-white/30 uppercase mt-0.5">Level 6 Sec</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage('settings')}
          className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white/80 transition-all cursor-pointer"
          title="Open Settings"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>
      </div>
    </aside>
  );
}
