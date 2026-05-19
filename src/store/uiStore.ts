import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createInitialMessages, createResetMessages, type Message } from '../lib/messages';
import type { PaletteKey, ThemeVars } from '../lib/themeEngine';

export type AiModel = 'gemini-3-flash' | 'gemini-3-pro' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'local-assistant';

export interface SystemMetrics {
  ramUsage: number;
  networkLatency: number;
  storageUsage: number;
  batteryLevel: number;
}

export interface UIStore {
  // Chat
  messages: Message[];
  isProcessing: boolean;
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  setIsProcessing: (b: boolean) => void;

  // Theme / Appearance
  activePalette: PaletteKey;
  customWallpaper: string | null;
  dynamicTheme: Partial<ThemeVars> | null;

  // AI Config
  aiModel: AiModel;
  systemInstructions: string;

  // Sensory
  audioFeedback: boolean;
  particleEffects: boolean;

  // UI State
  showSettings: boolean;
  settingsDocked: boolean;
  sidebarOpen: boolean;
  primaryView: 'chat' | 'earth';
  rightPanelMode: 'monitor' | 'learning';

  // System Monitor
  cpuLoad: number;
  setCpuLoad: (v: number) => void;
  systemMetrics: SystemMetrics;
  updateSystemMetrics: (m: Partial<SystemMetrics>) => void;

  // AI Sync
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: number | null;
  setSyncStatus: (status: UIStore['syncStatus']) => void;

  // Notion Connector
  notionEnabled: boolean;
  notionApiKey: string;
  notionDatabaseId: string;
  setNotionEnabled: (v: boolean) => void;
  setNotionApiKey: (v: string) => void;
  setNotionDatabaseId: (v: string) => void;

  // Direct setters for common toggles
  setShowSettings: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  setPrimaryView: (v: 'chat' | 'earth') => void;
  setRightPanelMode: (v: 'monitor' | 'learning') => void;

  // Generic settings updater (used by settings sub-panels)
  updateSettings: (settings: Partial<UIStore>) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Chat
      messages: createInitialMessages(),
      isProcessing: false,
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      clearMessages: () => set({ messages: createResetMessages() }),
      setIsProcessing: (isProcessing) => set({ isProcessing }),

      // Theme / Appearance
      activePalette: 'holographic' as PaletteKey,
      customWallpaper: null,
      dynamicTheme: null,

      // AI Config
      aiModel: 'gemini-2.5-flash',
      systemInstructions: 'You are Silver Wolf VI, a cyberpunk AI companion.',

      // Sensory
      audioFeedback: false,
      particleEffects: true,

      // UI State
      showSettings: false,
      settingsDocked: false,
      sidebarOpen: false,
      primaryView: 'chat',
      rightPanelMode: 'monitor',

      // System Monitor
      cpuLoad: 0.2,
      setCpuLoad: (cpuLoad) => set({ cpuLoad }),
      systemMetrics: {
        ramUsage: 0.35,
        networkLatency: 0.6,
        storageUsage: 0.45,
        batteryLevel: 0.9,
      },
      updateSystemMetrics: (m) =>
        set((s) => ({ systemMetrics: { ...s.systemMetrics, ...m } })),

      // AI Sync
      syncStatus: 'idle',
      lastSyncTime: null,
      setSyncStatus: (syncStatus) => set({ syncStatus, lastSyncTime: Date.now() }),

      // Notion Connector
      notionEnabled: false,
      notionApiKey: '',
      notionDatabaseId: '',
      setNotionEnabled: (notionEnabled) => set({ notionEnabled }),
      setNotionApiKey: (notionApiKey) => set({ notionApiKey }),
      setNotionDatabaseId: (notionDatabaseId) => set({ notionDatabaseId }),

      // Direct setters
      setShowSettings: (showSettings) => set({ showSettings }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setPrimaryView: (primaryView) => set({ primaryView }),
      setRightPanelMode: (rightPanelMode) => set({ rightPanelMode }),

      // Generic updater
      updateSettings: (settings) => set((s) => ({ ...s, ...settings })),
    }),
    {
      name: 'silver-wolf-v6-core',
      version: 2,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState;
        const { notionApiKey: _notionApiKey, ...safeState } = persistedState as Partial<UIStore> & {
          notionApiKey?: string;
        };
        return safeState;
      },
      partialize: (s) => ({
        activePalette: s.activePalette,
        aiModel: s.aiModel,
        systemInstructions: s.systemInstructions,
        audioFeedback: s.audioFeedback,
        particleEffects: s.particleEffects,
        lastSyncTime: s.lastSyncTime,
        notionEnabled: s.notionEnabled,
        notionDatabaseId: s.notionDatabaseId,
      }),
    }
  )
);
