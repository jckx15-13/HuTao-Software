import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createInitialMessages, createResetMessages, type Message } from '../lib/messages';
import type { PaletteKey, ThemeVars } from '../lib/themeEngine';
import { type LocationData } from '../data/locations';

export type AiModel = 'gemini-3-flash' | 'gemini-3-pro' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'local-assistant';

export interface SystemMetrics {
  ramUsage: number;
  networkLatency: number;
  storageUsage: number;
  batteryLevel: number;
}

export interface Personalisation {
  panelOpacity: number;
  blurIntensity: number;
  animationIntensity: number;
  motionReduced: boolean;
  cornerRadius: number;
  borderStyle: 'subtle' | 'glow' | 'solid' | 'none';
  shadowIntensity: number;
  chatBubbleStyle: 'glass' | 'solid' | 'minimal';
  iconStyle: 'outlined' | 'filled';
  uiDensity: 'comfortable' | 'compact' | 'spacious';
  fontScale: number;
  accentColor: string;
  fontFamily: 'Outfit' | 'Inter' | 'system-ui';
}

export interface ChatSession {
  id: string;
  name: string;
  type: 'global' | 'project';
  projectName?: string;
  messages: Message[];
  lastActive: number;
  createdAt: number;
}

export interface DiagnosticEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
  source: string;
}

export type InteractionMode = 'chat' | 'earth';
export type CurrentPage = 'launcher' | 'workspace' | 'settings';
export type RightPanelTab = 'context' | 'browser' | 'changes';
export type SettingsCategory = 'personalisation' | 'ai' | 'connections' | 'feedback' | 'about';

const defaultPersonalisation: Personalisation = {
  panelOpacity: 0.75,
  blurIntensity: 16,
  animationIntensity: 0.7,
  motionReduced: false,
  cornerRadius: 12,
  borderStyle: 'subtle',
  shadowIntensity: 0.5,
  chatBubbleStyle: 'glass',
  iconStyle: 'outlined',
  uiDensity: 'comfortable',
  fontScale: 1.0,
  accentColor: '',
  fontFamily: 'Outfit',
};

function createGlobalChat(): ChatSession {
  const now = Date.now();
  return {
    id: 'global-main',
    name: 'Main Chat',
    type: 'global',
    messages: createInitialMessages(now),
    lastActive: now,
    createdAt: now,
  };
}

let sessionCounter = 0;
function generateSessionId(): string {
  sessionCounter += 1;
  return `session-${Date.now()}-${sessionCounter}`;
}

export interface UIStore {
  // Chat Sessions
  chatSessions: ChatSession[];
  activeChatId: string;
  addChatSession: (name: string, type: 'global' | 'project', projectName?: string) => void;
  removeChatSession: (id: string) => void;
  setActiveChatId: (id: string) => void;

  // Active chat messages (derived from active session)
  messages: Message[];
  isProcessing: boolean;
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  setIsProcessing: (b: boolean) => void;

  // Theme / Appearance
  activePalette: PaletteKey;
  customWallpaper: string | null;
  dynamicTheme: Partial<ThemeVars> | null;

  // Personalisation
  personalisation: Personalisation;
  updatePersonalisation: (p: Partial<Personalisation>) => void;

  // AI Config
  aiModel: AiModel;
  systemInstructions: string;

  // Sensory
  audioFeedback: boolean;
  particleEffects: boolean;

  // Navigation
  currentPage: CurrentPage;
  setCurrentPage: (page: CurrentPage) => void;

  // Interaction Mode
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;

  // Location Selection
  activeLocation: LocationData | null;
  setActiveLocation: (loc: LocationData | null) => void;

  // ISS Tracking & Stream
  issFeedOpen: boolean;
  setIssFeedOpen: (open: boolean) => void;
  issTelemetry: {
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    timestamp: number;
    simulated?: boolean;
  } | null;
  setIssTelemetry: (t: any) => void;

  // Panel State
  leftPanelOpen: boolean;
  setLeftPanelOpen: (v: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (v: boolean) => void;
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;

  // Settings
  settingsCategory: SettingsCategory;
  setSettingsCategory: (cat: SettingsCategory) => void;

  // Launcher
  launcherDismissed: boolean;
  setLauncherDismissed: (v: boolean) => void;
  diagnostics: DiagnosticEntry[];
  addDiagnostic: (entry: Omit<DiagnosticEntry, 'id' | 'timestamp'>) => void;
  clearDiagnostics: () => void;

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

  // Legacy compatibility aliases
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  primaryView: 'chat' | 'earth';
  setPrimaryView: (v: 'chat' | 'earth') => void;
  rightPanelMode: 'monitor' | 'learning';
  setRightPanelMode: (v: 'monitor' | 'learning') => void;
  settingsDocked: boolean;

  // Generic settings updater
  updateSettings: (settings: Partial<UIStore>) => void;
}

let diagCounter = 0;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => {
      const globalChat = createGlobalChat();

      return {
        // Chat Sessions
        chatSessions: [globalChat],
        activeChatId: globalChat.id,
        addChatSession: (name, type, projectName) => {
          const id = generateSessionId();
          const now = Date.now();
          const newSession: ChatSession = {
            id,
            name,
            type,
            projectName,
            messages: [
              { id: `system-${now}-init`, sender: 'system', content: 'SESSION // INITIALIZED.', timestamp: now },
            ],
            lastActive: now,
            createdAt: now,
          };
          set((s) => ({
            chatSessions: [...s.chatSessions, newSession],
            activeChatId: id,
          }));
        },
        removeChatSession: (id) => {
          if (id === 'global-main') return;
          set((s) => {
            const sessions = s.chatSessions.filter((cs) => cs.id !== id);
            const newActive = s.activeChatId === id ? 'global-main' : s.activeChatId;
            return { chatSessions: sessions, activeChatId: newActive };
          });
        },
        setActiveChatId: (activeChatId) => set({ activeChatId }),

        // Active chat messages — computed from active session
        get messages() {
          const state = get();
          const session = state.chatSessions.find((s) => s.id === state.activeChatId);
          return session?.messages ?? [];
        },
        isProcessing: false,
        addMessage: (msg) =>
          set((s) => ({
            chatSessions: s.chatSessions.map((cs) =>
              cs.id === s.activeChatId
                ? { ...cs, messages: [...cs.messages, msg], lastActive: Date.now() }
                : cs,
            ),
          })),
        clearMessages: () =>
          set((s) => ({
            chatSessions: s.chatSessions.map((cs) =>
              cs.id === s.activeChatId
                ? { ...cs, messages: createResetMessages(), lastActive: Date.now() }
                : cs,
            ),
          })),
        setIsProcessing: (isProcessing) => set({ isProcessing }),

        // Theme / Appearance
        activePalette: 'holographic' as PaletteKey,
        customWallpaper: null,
        dynamicTheme: null,

        // Personalisation
        personalisation: { ...defaultPersonalisation },
        updatePersonalisation: (p) =>
          set((s) => ({ personalisation: { ...s.personalisation, ...p } })),

        // AI Config
        aiModel: 'gemini-2.5-flash',
        systemInstructions: 'You are Silver Wolf VI, a cyberpunk AI companion.',

        // Sensory
        audioFeedback: false,
        particleEffects: true,

        // Navigation
        currentPage: 'launcher',
        setCurrentPage: (currentPage) => set({ currentPage }),

        // Interaction Mode
        interactionMode: 'chat',
        setInteractionMode: (interactionMode) => set({ interactionMode }),

        // Location Selection
        activeLocation: null,
        setActiveLocation: (activeLocation) => set({ activeLocation }),

        // ISS Tracking & Stream
        issFeedOpen: false,
        setIssFeedOpen: (issFeedOpen) => set({ issFeedOpen }),
        issTelemetry: null,
        setIssTelemetry: (issTelemetry) => set({ issTelemetry }),

        // Panel State
        leftPanelOpen: true,
        setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),
        rightPanelOpen: true,
        setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
        rightPanelTab: 'context',
        setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),

        // Settings
        settingsCategory: 'personalisation',
        setSettingsCategory: (settingsCategory) => set({ settingsCategory }),

        // Launcher
        launcherDismissed: false,
        setLauncherDismissed: (launcherDismissed) => set({ launcherDismissed, currentPage: 'workspace' }),
        diagnostics: [],
        addDiagnostic: (entry) => {
          diagCounter += 1;
          set((s) => ({
            diagnostics: [
              ...s.diagnostics,
              { ...entry, id: `diag-${Date.now()}-${diagCounter}`, timestamp: Date.now() },
            ],
          }));
        },
        clearDiagnostics: () => set({ diagnostics: [] }),

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

        // Legacy compatibility
        get showSettings() {
          return get().currentPage === 'settings';
        },
        setShowSettings: (v) => set({ currentPage: v ? 'settings' : 'workspace' }),
        get sidebarOpen() {
          return get().leftPanelOpen;
        },
        setSidebarOpen: (sidebarOpen) => set({ leftPanelOpen: sidebarOpen }),
        get primaryView() {
          return get().interactionMode;
        },
        setPrimaryView: (v) => set({ interactionMode: v }),
        rightPanelMode: 'monitor',
        setRightPanelMode: (rightPanelMode) => set({ rightPanelMode }),
        settingsDocked: false,

        // Generic updater
        updateSettings: (settings) => set((s) => ({ ...s, ...settings })),
      };
    },
    {
      name: 'silver-wolf-v6-core',
      version: 3,
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
        personalisation: s.personalisation,
        launcherDismissed: s.launcherDismissed,
        interactionMode: s.interactionMode,
        leftPanelOpen: s.leftPanelOpen,
        rightPanelOpen: s.rightPanelOpen,
      }),
    },
  ),
);
