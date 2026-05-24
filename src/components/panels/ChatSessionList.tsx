import { MessageSquare, Plus, Trash2, FolderGit } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export function ChatSessionList() {
  const chatSessions = useUIStore((s) => s.chatSessions);
  const activeChatId = useUIStore((s) => s.activeChatId);
  const addChatSession = useUIStore((s) => s.addChatSession);
  const removeChatSession = useUIStore((s) => s.removeChatSession);
  const setActiveChatId = useUIStore((s) => s.setActiveChatId);

  // Group chats by global vs project
  const globalChats = chatSessions.filter((c) => c.type === 'global');
  const projectChats = chatSessions.filter((c) => c.type === 'project');

  const handleCreateProjectChat = () => {
    const name = prompt('Enter project chat name:', 'New Project');
    if (name) {
      addChatSession(name, 'project', 'Workspace');
    }
  };

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* Global Chats */}
      <div className="flex flex-col gap-1">
        {globalChats.map((chat) => {
          const isActive = chat.id === activeChatId;
          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => setActiveChatId(chat.id)}
              className={`group flex h-8 w-full items-center justify-between rounded px-2.5 text-[11px] text-white/70 hover:bg-white/5 hover:text-white/95 transition-all select-none cursor-pointer border-l-2 ${
                isActive ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-white/30'}`} />
                <span>{chat.name}</span>
              </div>
              <span className="rounded bg-primary/20 px-1 text-[8px] text-primary">GLOBAL</span>
            </button>
          );
        })}
      </div>

      {/* Project Chats Header */}
      <div className="flex items-center justify-between px-2 text-[9px] uppercase tracking-widest text-white/30 font-bold select-none">
        <span>Project Workspaces</span>
        <button
          type="button"
          onClick={handleCreateProjectChat}
          className="rounded p-0.5 hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
          title="New Project Chat"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Project Chats List */}
      <div className="flex flex-col gap-1">
        {projectChats.length === 0 ? (
          <div className="px-2.5 py-1 text-[10px] text-white/20 italic">No project workspaces.</div>
        ) : (
          projectChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                className={`group flex h-8 w-full items-center justify-between rounded px-2.5 text-[11px] text-white/70 hover:bg-white/5 transition-all ${
                  isActive ? 'bg-primary/10 text-primary font-bold' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveChatId(chat.id)}
                  className="flex flex-1 items-center gap-2 truncate text-left cursor-pointer"
                >
                  <FolderGit className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-white/30'}`} />
                  <span className="truncate">{chat.name}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this workspace chat?')) {
                      removeChatSession(chat.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-red-400 transition-all"
                  title="Delete workspace"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
