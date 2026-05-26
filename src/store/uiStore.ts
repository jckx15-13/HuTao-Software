import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createInitialMessages, createResetMessages, type Message } from '../lib/messages';
import type { PaletteKey, ThemeVars } from '../lib/themeEngine';
import { type LocationData } from '../data/locations';
import { type Tour } from '../data/tours';

export type AiModel = 'gemini-3-flash' | 'gemini-3-pro' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'local-assistant' | 'gemini-3.1-pro-preview' | 'gemini-1.5-pro' | 'gemini-1.5-flash';

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
  panelTransitionStyle: 'slide' | 'swing-3d' | 'fade';
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

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'primary';
}

export interface TelescopePreset {
  name: string;
  url: string;
  ra: string;
  dec: string;
  fov: string;
  description: string;
}

export type InteractionMode = 'chat' | 'orbital' | 'telescope';
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
  panelTransitionStyle: 'slide',
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
  setMessages: (messages: Message[]) => void;
  setIsProcessing: (b: boolean) => void;

  // Theme / Appearance
  activePalette: PaletteKey;
  setActivePalette: (palette: PaletteKey) => void;
  customWallpaper: string | null;
  setCustomWallpaper: (url: string | null) => void;
  dynamicTheme: Partial<ThemeVars> | null;
  setDynamicTheme: (theme: Partial<ThemeVars> | null) => void;

  // Personalisation
  personalisation: Personalisation;
  updatePersonalisation: (p: Partial<Personalisation>) => void;

  // AI Config
  aiModel: AiModel;
  setAiModel: (model: AiModel) => void;
  systemInstructions: string;
  setSystemInstructions: (instructions: string) => void;

  // Sensory
  audioFeedback: boolean;
  setAudioFeedback: (enabled: boolean) => void;
  particleEffects: boolean;
  setParticleEffects: (enabled: boolean) => void;
  terminalFontSize: number;
  setTerminalFontSize: (size: number) => void;

  // Navigation
  currentPage: CurrentPage;
  setCurrentPage: (page: CurrentPage) => void;

  // Interaction Mode
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  // Visual overlays
  scanlineOverlay: boolean;
  setScanlineOverlay: (v: boolean) => void;
  showBorders: boolean;
  setShowBorders: (v: boolean) => void;
  showTerrain: boolean;
  setShowTerrain: (v: boolean) => void;
  showRoads: boolean;
  setShowRoads: (v: boolean) => void;
  // Camera / control sensitivity
  cameraSensitivity: number;
  setCameraSensitivity: (v: number) => void;

  activeLocation: LocationData | null;
  setActiveLocation: (loc: LocationData | null) => void;
  measureStart: LocationData | null;
  setMeasureStart: (loc: LocationData | null) => void;
  measureEnd: LocationData | null;
  setMeasureEnd: (loc: LocationData | null) => void;
  telescopeTarget: TelescopePreset | null;
  setTelescopeTarget: (preset: TelescopePreset | null) => void;
  activeTour: Tour | null;
  setActiveTour: (tour: Tour | null) => void;
  activeTourStepIndex: number;
  setActiveTourStepIndex: (idx: number) => void;

  // Browser URL
  browserUrl: string;
  setBrowserUrl: (url: string) => void;

  // Change Logs
  changeLogs: ChangeLogEntry[];
  addChangeLog: (category: string, message: string, level?: ChangeLogEntry['level']) => void;
  clearChangeLogs: () => void;

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
  primaryView: 'chat' | 'orbital' | 'telescope';
  setPrimaryView: (v: 'chat' | 'orbital' | 'telescope') => void;
  rightPanelMode: 'monitor' | 'learning';
  setRightPanelMode: (v: 'monitor' | 'learning') => void;
  settingsDocked: boolean;
  setSettingsDocked: (v: boolean) => void;

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
        setMessages: (messages) =>
          set((s) => ({
            chatSessions: s.chatSessions.map((cs) =>
              cs.id === s.activeChatId ? { ...cs, messages, lastActive: Date.now() } : cs
            ),
          })),

        // Theme / Appearance
        activePalette: 'hsrOrbital' as PaletteKey,
        setActivePalette: (activePalette) => set({ activePalette }),
        customWallpaper: null,
        setCustomWallpaper: (customWallpaper) => set({ customWallpaper }),
        dynamicTheme: null,
        setDynamicTheme: (dynamicTheme) => set({ dynamicTheme }),

        // Personalisation
        personalisation: { ...defaultPersonalisation },
        updatePersonalisation: (p) =>
          set((s) => ({ personalisation: { ...s.personalisation, ...p } })),

        // AI Config
        aiModel: 'gemini-2.5-flash',
        setAiModel: (aiModel) => set({ aiModel }),
        systemInstructions: 'You are Silver Wolf VI, a cyberpunk AI companion.',
        setSystemInstructions: (systemInstructions) => set({ systemInstructions }),

        // Sensory
        audioFeedback: false,
        setAudioFeedback: (audioFeedback) => set({ audioFeedback }),
        particleEffects: true,
        setParticleEffects: (particleEffects) => set({ particleEffects }),
        terminalFontSize: 15,
        setTerminalFontSize: (terminalFontSize) => set({ terminalFontSize }),

        // Navigation
        currentPage: 'launcher',
        setCurrentPage: (currentPage) => set({ currentPage }),

        // Interaction Mode
        interactionMode: 'chat',
        setInteractionMode: (interactionMode) => set({ interactionMode }),
        // Scanline / CRT overlay (off by default)
        scanlineOverlay: false,
        setScanlineOverlay: (scanlineOverlay) => set({ scanlineOverlay }),
        // Camera sensitivity (1.0 = default)
        cameraSensitivity: 1.0,
        setCameraSensitivity: (cameraSensitivity) => set({ cameraSensitivity }),
        showBorders: true,
        setShowBorders: (showBorders) => set({ showBorders }),
        showTerrain: true,
        setShowTerrain: (showTerrain) => set({ showTerrain }),
        showRoads: false,
        setShowRoads: (showRoads) => set({ showRoads }),

        // Location Selection
        activeLocation: null,
        setActiveLocation: (activeLocation) => {
          set({ activeLocation });
          if (activeLocation) {
            set({ rightPanelTab: 'context', rightPanelOpen: true });
          }
        },
        measureStart: null,
        setMeasureStart: (measureStart) => set({ measureStart }),
        measureEnd: null,
        setMeasureEnd: (measureEnd) => set({ measureEnd }),
        telescopeTarget: null,
        setTelescopeTarget: (telescopeTarget) => set({ telescopeTarget }),
        activeTour: null,
        setActiveTour: (activeTour) => set({ activeTour }),
        activeTourStepIndex: 0,
        setActiveTourStepIndex: (activeTourStepIndex) => set({ activeTourStepIndex }),

        // Browser URL
        browserUrl: 'https://nasa.gov',
        setBrowserUrl: (browserUrl) => set({ browserUrl }),

        // Change Logs
        changeLogs: [
          {
            id: 'init-log-1',
            timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
            category: 'SYSTEM',
            message: 'Cesium 3D render engine bound to main viewport.',
            level: 'success',
          },
          {
            id: 'init-log-2',
            timestamp: new Date(Date.now() - 200000).toLocaleTimeString(),
            category: 'WORK_SPACE',
            message: 'UI layout transitioned to 3-panel space shell.',
            level: 'primary',
          },
          {
            id: 'init-log-3',
            timestamp: new Date(Date.now() - 100000).toLocaleTimeString(),
            category: 'ORBITAL_ARRAY',
            message: 'ISS Satcom live telemetry active.',
            level: 'info',
          },
        ],
        addChangeLog: (category, message, level = 'info') => {
          const newEntry: ChangeLogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleTimeString(),
            category: category.toUpperCase().replace(/\s+/g, '_'),
            message,
            level,
          };
          set((s) => ({ changeLogs: [newEntry, ...s.changeLogs].slice(0, 100) }));
        },
        clearChangeLogs: () => set({ changeLogs: [] }),

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
        setSettingsDocked: (settingsDocked) => set({ settingsDocked }),

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
        scanlineOverlay: s.scanlineOverlay,
        cameraSensitivity: s.cameraSensitivity,
        leftPanelOpen: s.leftPanelOpen,
        rightPanelOpen: s.rightPanelOpen,
        browserUrl: s.browserUrl,
        changeLogs: s.changeLogs,
        showBorders: s.showBorders,
        showTerrain: s.showTerrain,
        showRoads: s.showRoads,
      }),
    },
  ),
);
