import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createInitialMessages, createResetMessages, type Message } from '../lib/messages';
import { normalizeAiModel } from '../core/defaults/uiDefaults';

export type AiModel =
  | 'gemini-3.5-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3-flash-preview'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'local-assistant'
  | 'odysseus-local';

export interface ChatSession {
  id: string;
  name: string;
  type: 'global' | 'project';
  projectName?: string;
  messages: Message[];
  lastActive: number;
  createdAt: number;
}

export interface ChatState {
  chatSessions: ChatSession[];
  activeChatId: string;
  messages: Message[];
  isProcessing: boolean;
  aiModel: AiModel;
  systemInstructions: string;
  audioFeedback: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: number | null;
  notionEnabled: boolean;
  notionApiKey: string;
  notionDatabaseId: string;

  addChatSession: (name: string, type: 'global' | 'project', projectName?: string) => void;
  removeChatSession: (id: string) => void;
  setActiveChatId: (id: string) => void;
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  setIsProcessing: (b: boolean) => void;
  setMessageContent: (messageId: string, content: string) => void;
  appendToMessage: (messageId: string, content: string) => void;
  setAiModel: (model: AiModel) => void;
  setSystemInstructions: (instructions: string) => void;
  setAudioFeedback: (enabled: boolean) => void;
  setSyncStatus: (status: ChatState['syncStatus']) => void;
  setNotionEnabled: (enabled: boolean) => void;
  setNotionApiKey: (apiKey: string) => void;
  setNotionDatabaseId: (databaseId: string) => void;
}

function createGlobalChat(): ChatSession {
  const now = Date.now();
  return {
    id: 'global-main',
    name: 'Main Chat',
    type: 'global',
    messages: createInitialMessages(now),
    lastActive: now,
    createdAt: now
  };
}

let sessionCounter = 0;
function generateSessionId(): string {
  sessionCounter += 1;
  return `session-${Date.now()}-${sessionCounter}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => {
      const globalChat = createGlobalChat();
      return {
        chatSessions: [globalChat],
        activeChatId: globalChat.id,
        messages: globalChat.messages,
        isProcessing: false,
        aiModel: 'local-assistant',
        systemInstructions: 'You are Silver Wolf VI, a cyberpunk AI companion.',
        audioFeedback: false,
        syncStatus: 'idle',
        lastSyncTime: null,
        notionEnabled: false,
        notionApiKey: '',
        notionDatabaseId: '',

        addChatSession: (name, type, projectName) => {
          const id = generateSessionId();
          const now = Date.now();
          const newSession: ChatSession = {
            id,
            name,
            type,
            projectName,
            messages: [
              { id: `system-${now}-init`, sender: 'system', content: 'SESSION // INITIALIZED.', timestamp: now }
            ],
            lastActive: now,
            createdAt: now
          };
          set((s) => ({
            chatSessions: [...s.chatSessions, newSession],
            activeChatId: id,
            messages: newSession.messages
          }));
        },

        removeChatSession: (id) => {
          if (id === 'global-main') return;
          set((s) => {
            const sessions = s.chatSessions.filter((cs) => cs.id !== id);
            const newActive = s.activeChatId === id ? 'global-main' : s.activeChatId;
            const activeSession = sessions.find((cs) => cs.id === newActive);
            return { chatSessions: sessions, activeChatId: newActive, messages: activeSession?.messages ?? [] };
          });
        },

        setActiveChatId: (activeChatId) =>
          set((s) => {
            const activeSession = s.chatSessions.find((session) => session.id === activeChatId);
            return { activeChatId, messages: activeSession?.messages ?? [] };
          }),

        addMessage: (msg) =>
          set((s) => {
            const now = Date.now();
            const messages = [...s.messages, msg];
            return {
              messages,
              chatSessions: s.chatSessions.map((cs) =>
                cs.id === s.activeChatId ? { ...cs, messages, lastActive: now } : cs
              )
            };
          }),

        clearMessages: () =>
          set((s) => {
            const messages = createResetMessages();
            const now = Date.now();
            return {
              messages,
              chatSessions: s.chatSessions.map((cs) =>
                cs.id === s.activeChatId ? { ...cs, messages, lastActive: now } : cs
              )
            };
          }),

        setIsProcessing: (isProcessing) => set({ isProcessing }),

        setMessageContent: (messageId, content) =>
          set((s) => {
            const now = Date.now();
            let found = false;
            const messages = s.messages.map((m) => {
              if (m.id !== messageId) return m;
              found = true;
              return { ...m, content };
            });
            if (!found) return s;
            return {
              messages,
              chatSessions: s.chatSessions.map((cs) =>
                cs.id === s.activeChatId ? { ...cs, messages, lastActive: now } : cs
              )
            };
          }),

        appendToMessage: (messageId, content) =>
          set((s) => {
            if (!content) return s;
            const now = Date.now();
            let found = false;
            const messages = s.messages.map((m) => {
              if (m.id !== messageId) return m;
              found = true;
              return { ...m, content: `${m.content}${content}` };
            });
            if (!found) return s;
            return {
              messages,
              chatSessions: s.chatSessions.map((cs) =>
                cs.id === s.activeChatId ? { ...cs, messages, lastActive: now } : cs
              )
            };
          }),

        setMessages: (messages) =>
          set((s) => {
            const now = Date.now();
            return {
              messages,
              chatSessions: s.chatSessions.map((cs) =>
                cs.id === s.activeChatId ? { ...cs, messages, lastActive: now } : cs
              )
            };
          }),

        setAiModel: (aiModel) => set({ aiModel: normalizeAiModel(aiModel) }),
        setSystemInstructions: (systemInstructions) => set({ systemInstructions }),
        setAudioFeedback: (audioFeedback) => set({ audioFeedback }),
        setSyncStatus: (syncStatus) => set({ syncStatus, lastSyncTime: Date.now() }),
        setNotionEnabled: (notionEnabled) => set({ notionEnabled }),
        setNotionApiKey: (notionApiKey) => set({ notionApiKey }),
        setNotionDatabaseId: (notionDatabaseId) => set({ notionDatabaseId })
      };
    },
    {
      name: 'silver-wolf-v6-chat',
      partialize: (s) => ({
        aiModel: s.aiModel,
        systemInstructions: s.systemInstructions,
        audioFeedback: s.audioFeedback,
        lastSyncTime: s.lastSyncTime,
        notionEnabled: s.notionEnabled,
        notionDatabaseId: s.notionDatabaseId
      })
    }
  )
);
