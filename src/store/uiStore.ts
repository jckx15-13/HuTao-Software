import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createInitialMessages, createResetMessages, type Message } from '../lib/messages';
import type { PaletteKey, ThemeVars } from '../lib/themeEngine';
import { type LocationData } from '../data/locations';
import { type Tour } from '../data/tours';
import { type WeatherData } from '../services/weatherService';

export type AiModel =
  | 'gemini-3.5-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3-flash-preview'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'local-assistant'
  | 'odysseus-local';

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
  minimalMode: boolean;
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
  lookAt?: string;
}

export interface SatelliteData {
  tle: string[]; // TLE lines
  timestamp: number;
}

export interface TelescopeTelemetry {
  ra: number;
  dec: number;
  roll: number;
}

export type InteractionMode = 'chat' | 'orbital' | 'telescope';
export type SyncSource = 'cesium' | 'wwt' | 'none';
export type CosmosBackgroundMode = 'deep-black' | 'sparkling' | 'wwt-milkyway';
export type WwtBackgroundLayer = string;
export type CurrentPage = 'launcher' | 'workspace' | 'settings';
export type RightPanelTab = 'context' | 'browser' | 'changes' | 'diagnostics' | 'telemetry' | 'odysseus';
export type SettingsCategory =
  'personalisation' | 'ai' | 'connections' | 'feedback' | 'developer' | 'about' | 'map' | 'plugins';

const defaultPersonalisation: Personalisation = {
  panelOpacity: 0.88,
  blurIntensity: 6,
  animationIntensity: 0.35,
  motionReduced: false,
  cornerRadius: 20,
  borderStyle: 'solid',
  shadowIntensity: 0.2,
  chatBubbleStyle: 'solid',
  minimalMode: false,
  iconStyle: 'outlined',
  uiDensity: 'compact',
  fontScale: 1.0,
  accentColor: '',
  fontFamily: 'Inter',
  panelTransitionStyle: 'fade'
};

const activeAiModels = new Set<AiModel>([
  'local-assistant',
  'odysseus-local',
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
]);

function normalizeAiModel(model: unknown): AiModel {
  if (typeof model !== 'string') return 'local-assistant';

  if (model === 'gemini-3-flash') return 'gemini-3-flash-preview';
  if (model === 'gemini-3-pro') return 'gemini-3.1-pro-preview';
  if (model.startsWith('gpt-')) return 'local-assistant';

  return activeAiModels.has(model as AiModel) ? (model as AiModel) : 'local-assistant';
}

function normalizePersonalisation(personalisation?: Partial<Personalisation> | null): Personalisation {
  const merged = { ...defaultPersonalisation, ...(personalisation || {}) };
  const isMinimal = merged.minimalMode === true;
  const panelRange = isMinimal ? { min: 0.78, max: 0.98 } : { min: 0.72, max: 0.98 };
  const blurRange = isMinimal ? { min: 0, max: 8 } : { min: 0, max: 16 };

  return {
    ...merged,
    panelOpacity: Math.max(
      panelRange.min,
      Math.min(panelRange.max, merged.panelOpacity ?? defaultPersonalisation.panelOpacity)
    ),
    blurIntensity: Math.max(
      blurRange.min,
      Math.min(blurRange.max, merged.blurIntensity ?? defaultPersonalisation.blurIntensity)
    ),
    chatBubbleStyle: merged.chatBubbleStyle || defaultPersonalisation.chatBubbleStyle
  };
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
  setMessageContent: (messageId: string, content: string) => void;
  appendToMessage: (messageId: string, content: string) => void;

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
  /** Selected custom cursor design identifier */
  cursorDesign: string;
  /** Set the active cursor design */
  setCursorDesign: (id: string) => void;

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

  // Camera Sync
  syncSource: SyncSource;
  setSyncSource: (v: SyncSource) => void;
  telescopeTelemetry: TelescopeTelemetry | null;
  setTelescopeTelemetry: (v: TelescopeTelemetry | null) => void;

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
  setIssTelemetry: (
    t: {
      latitude: number;
      longitude: number;
      altitude: number;
      velocity: number;
      timestamp: number;
      simulated?: boolean;
    } | null
  ) => void;

  // Satellite Ingestion & Tracker State
  activeSatelliteId: string | null;
  setActiveSatelliteId: (id: string | null) => void;
  satelliteCategories: Record<string, boolean>;
  toggleSatelliteCategory: (category: string) => void;
  satelliteSettings: {
    showTrails: boolean;
    showAllTrails: boolean;
    occludeByGlobe: boolean;
    trailLength: number;
    iconSize: number;
  };
  updateSatelliteSettings: (settings: Partial<UIStore['satelliteSettings']>) => void;
  satelliteData: Record<string, SatelliteData>;
  setSatelliteData: (id: string, data: SatelliteData) => void;
  weatherData: WeatherData | null;
  setWeatherData: (data: WeatherData | null) => void;

  // Developer Diagnostics State
  forceFallback: boolean;
  setForceFallback: (v: boolean) => void;
  engineUrlOverride: string;
  setEngineUrlOverride: (v: string) => void;
  imageryProvider: string;
  setImageryProvider: (v: string) => void;
  spaceBlendOpacity: number;
  setSpaceBlendOpacity: (v: number) => void;
  cosmosBackgroundMode: CosmosBackgroundMode;
  setCosmosBackgroundMode: (v: CosmosBackgroundMode) => void;
  wwtBackgroundLayer: WwtBackgroundLayer;
  setWwtBackgroundLayer: (v: WwtBackgroundLayer) => void;
  spaceInteractionTarget: 'earth' | 'telescope';
  setSpaceInteractionTarget: (v: 'earth' | 'telescope') => void;

  // Panel State
  leftPanelOpen: boolean;
  setLeftPanelOpen: (v: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (v: boolean) => void;
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;
  topBarOpen: boolean;
  setTopBarOpen: (v: boolean) => void;
  modeSwitcherOpen: boolean;
  setModeSwitcherOpen: (v: boolean) => void;
  bottomBarOpen: boolean;
  setBottomBarOpen: (v: boolean) => void;
  spaceHudTab: 'navigation' | 'layers' | 'target' | 'system';
  setSpaceHudTab: (v: 'navigation' | 'layers' | 'target' | 'system') => void;

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

  // Odysseus Engine
  odysseusReady: boolean;
  setOdysseusReady: (v: boolean) => void;

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
        messages: globalChat.messages,
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

        // Active chat messages are stored explicitly so Zustand selectors update reliably.
        isProcessing: false,
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
            const messages = s.messages.map((message) => {
              if (message.id !== messageId) return message;
              found = true;
              return { ...message, content };
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
            const messages = s.messages.map((message) => {
              if (message.id !== messageId) return message;
              found = true;
              return { ...message, content: `${message.content}${content}` };
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

        // Theme / Appearance
        activePalette: 'holographic' as PaletteKey,
        setActivePalette: (activePalette) => set({ activePalette }),
        customWallpaper: null,
        setCustomWallpaper: (customWallpaper) => set({ customWallpaper }),
        dynamicTheme: null,
        setDynamicTheme: (dynamicTheme) => set({ dynamicTheme }),

        // Personalisation
        personalisation: normalizePersonalisation(defaultPersonalisation),
        updatePersonalisation: (p) =>
          set((s) => ({ personalisation: normalizePersonalisation({ ...s.personalisation, ...p }) })),

        // Custom cursor design
        cursorDesign: 'reticle-v1',
        setCursorDesign: (cursorDesign) => set({ cursorDesign }),

        // AI Config
        aiModel: 'local-assistant',
        setAiModel: (aiModel) => set({ aiModel: normalizeAiModel(aiModel) }),
        systemInstructions: 'You are Silver Wolf VI, a cyberpunk AI companion.',
        setSystemInstructions: (systemInstructions) => set({ systemInstructions }),

        // Sensory
        audioFeedback: false,
        setAudioFeedback: (audioFeedback) => set({ audioFeedback }),
        particleEffects: false,
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
        showRoads: true,
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

        // Camera Sync
        syncSource: 'none',
        setSyncSource: (syncSource) => set({ syncSource }),
        telescopeTelemetry: null,
        setTelescopeTelemetry: (telescopeTelemetry) => set({ telescopeTelemetry }),

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
            level: 'success'
          },
          {
            id: 'init-log-2',
            timestamp: new Date(Date.now() - 200000).toLocaleTimeString(),
            category: 'WORK_SPACE',
            message: 'UI layout transitioned to 3-panel space shell.',
            level: 'primary'
          },
          {
            id: 'init-log-3',
            timestamp: new Date(Date.now() - 100000).toLocaleTimeString(),
            category: 'ORBITAL_ARRAY',
            message: 'ISS Satcom live telemetry active.',
            level: 'info'
          }
        ],
        addChangeLog: (category, message, level = 'info') => {
          const newEntry: ChangeLogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleTimeString(),
            category: category.toUpperCase().replace(/\s+/g, '_'),
            message,
            level
          };
          set((s) => ({ changeLogs: [newEntry, ...s.changeLogs].slice(0, 100) }));
        },
        clearChangeLogs: () => set({ changeLogs: [] }),

        // ISS Tracking & Stream
        issFeedOpen: false,
        setIssFeedOpen: (issFeedOpen) => set({ issFeedOpen }),
        issTelemetry: null,
        setIssTelemetry: (issTelemetry) => set({ issTelemetry }),

        // Satellite Ingestion & Tracker State
        activeSatelliteId: null,
        setActiveSatelliteId: (activeSatelliteId) => set({ activeSatelliteId }),
        satelliteCategories: {
          spaceStations: true,
          brightest: true,
          weather: true,
          gps: true,
          earthObs: true,
          starlink: true,
          military: true,
          other: true
        },
        toggleSatelliteCategory: (category) =>
          set((s) => ({
            satelliteCategories: {
              ...s.satelliteCategories,
              [category]: !s.satelliteCategories[category]
            }
          })),
        satelliteSettings: {
          showTrails: true,
          showAllTrails: true,
          occludeByGlobe: true,
          trailLength: 40,
          iconSize: 18
        },
        updateSatelliteSettings: (settings) =>
          set((s) => ({
            satelliteSettings: { ...s.satelliteSettings, ...settings }
          })),
        satelliteData: {},
        setSatelliteData: (id, data) =>
          set((s) => ({
            satelliteData: { ...s.satelliteData, [id]: data }
          })),
        weatherData: null,
        setWeatherData: (weatherData) => set({ weatherData }),

        // Developer Diagnostics State
        forceFallback: false,
        setForceFallback: (forceFallback) => set({ forceFallback }),
        engineUrlOverride: '',
        setEngineUrlOverride: (engineUrlOverride) => set({ engineUrlOverride }),
        imageryProvider: 'arcgis-world',
        setImageryProvider: (imageryProvider) => set({ imageryProvider }),
        spaceBlendOpacity: 0.35,
        setSpaceBlendOpacity: (spaceBlendOpacity) => set({ spaceBlendOpacity }),
          cosmosBackgroundMode: 'wwt-milkyway',
          setCosmosBackgroundMode: (cosmosBackgroundMode) => set({ cosmosBackgroundMode }),
          wwtBackgroundLayer: '3D Solar System View',
          setWwtBackgroundLayer: (wwtBackgroundLayer) => set({ wwtBackgroundLayer }),
        spaceInteractionTarget: 'earth',
        setSpaceInteractionTarget: (spaceInteractionTarget) => set({ spaceInteractionTarget }),

        // Panel State
        leftPanelOpen: true,
        setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),
        rightPanelOpen: true,
        setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
        rightPanelTab: 'context',
        setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
        topBarOpen: true,
        setTopBarOpen: (topBarOpen) => set({ topBarOpen }),
        modeSwitcherOpen: true,
        setModeSwitcherOpen: (modeSwitcherOpen) => set({ modeSwitcherOpen }),
        bottomBarOpen: true,
        setBottomBarOpen: (bottomBarOpen) => set({ bottomBarOpen }),
        spaceHudTab: 'layers',
        setSpaceHudTab: (spaceHudTab) => set({ spaceHudTab }),

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
              { ...entry, id: `diag-${Date.now()}-${diagCounter}`, timestamp: Date.now() }
            ]
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
          batteryLevel: 0.9
        },
        updateSystemMetrics: (m) => set((s) => ({ systemMetrics: { ...s.systemMetrics, ...m } })),

        // Odysseus Engine
        odysseusReady: false,
        setOdysseusReady: (odysseusReady) => set({ odysseusReady }),

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
        updateSettings: (settings) =>
          set((s) => ({
            ...s,
            ...settings,
            aiModel: settings.aiModel ? normalizeAiModel(settings.aiModel) : s.aiModel,
            personalisation: settings.personalisation
              ? normalizePersonalisation(settings.personalisation)
              : s.personalisation
          }))
      };
    },
    {
      name: 'silver-wolf-v6-core',
      version: 9,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState;
        const { notionApiKey: _notionApiKey, ...safeState } = persistedState as Partial<UIStore> & {
          notionApiKey?: string;
        };
        const migrated = { ...safeState };
        migrated.aiModel = normalizeAiModel(migrated.aiModel);
        migrated.particleEffects = true;
        migrated.leftPanelOpen = true;
        migrated.rightPanelOpen = true;
        migrated.scanlineOverlay = false;
        migrated.showBorders = true;
        migrated.imageryProvider =
          migrated.imageryProvider === 'cesium' ? 'arcgis-world' : migrated.imageryProvider || 'arcgis-world';
          migrated.cosmosBackgroundMode = migrated.cosmosBackgroundMode || 'wwt-milkyway';
          migrated.wwtBackgroundLayer =
            migrated.wwtBackgroundLayer && migrated.wwtBackgroundLayer !== 'Visible Imagery'
              ? migrated.wwtBackgroundLayer
              : '3D Solar System View';
        migrated.personalisation = normalizePersonalisation({
          ...migrated.personalisation,
          minimalMode: false,
          panelOpacity: 0.88,
          blurIntensity: 10,
          animationIntensity: 0.65,
          motionReduced: false,
          cornerRadius: 20,
          shadowIntensity: 0.45,
          borderStyle: 'glow',
          chatBubbleStyle: 'glass',
          uiDensity: 'compact'
        });
        return migrated;
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
        activeSatelliteId: s.activeSatelliteId,
        satelliteCategories: s.satelliteCategories,
        satelliteSettings: s.satelliteSettings,
        satelliteData: s.satelliteData,
        forceFallback: s.forceFallback,
        engineUrlOverride: s.engineUrlOverride,
        imageryProvider: s.imageryProvider,
        cursorDesign: s.cursorDesign,
        spaceBlendOpacity: s.spaceBlendOpacity,
          cosmosBackgroundMode: s.cosmosBackgroundMode,
          wwtBackgroundLayer: s.wwtBackgroundLayer,
        spaceInteractionTarget: s.spaceInteractionTarget
      })
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).useUIStore = useUIStore;
}
