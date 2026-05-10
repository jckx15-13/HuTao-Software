/**
 * MODULE: State Management
 * FEATURE: Application State Store
 */
import { create } from 'zustand';
import type { PaletteKey, ThemeVars } from '../lib/themeEngine';
import { createInitialMessages, createResetMessages, type Message } from '../lib/messages';

interface SystemMetrics {
  ramUsage: number;
  networkLatency: number;
  storageUsage: number;
  batteryLevel: number;
}

export type AiModel = 'gemini-3.1-pro-preview' | 'gemini-1.5-pro' | 'gemini-1.5-flash';

interface UIStore {
  // Core System Stats
  cpuLoad: number; // 0.0 to 1.0
  setCpuLoad: (val: number) => void;
  
  systemMetrics: SystemMetrics;
  updateSystemMetrics: (data: Partial<SystemMetrics>) => void;
  
  messages: Message[];
  addMessage: (msg: Message) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  
  isProcessing: boolean;
  setIsProcessing: (b: boolean) => void;

  // UI Mode
  customWallpaper: string | null;
  setCustomWallpaper: (url: string | null) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  settingsDocked: boolean;
  setSettingsDocked: (docked: boolean) => void;
  
  // Customization
  particleEffects: boolean;
  setParticleEffects: (enabled: boolean) => void;
  audioFeedback: boolean;
  setAudioFeedback: (enabled: boolean) => void;
  terminalFontSize: number;
  setTerminalFontSize: (size: number) => void;

  activePalette: PaletteKey;
  setActivePalette: (palette: PaletteKey) => void;
  dynamicTheme: Partial<ThemeVars> | null;
  setDynamicTheme: (theme: Partial<ThemeVars> | null) => void;

  aiModel: AiModel;
  setAiModel: (model: AiModel) => void;
  systemInstructions: string;
  setSystemInstructions: (instructions: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  cpuLoad: 0.2,
  setCpuLoad: (val) => set({ cpuLoad: Math.max(0, Math.min(1, val)) }),
  
  systemMetrics: {
    ramUsage: 0.2,
    networkLatency: 0.8,
    storageUsage: 0.15,
    batteryLevel: 0.9,
  },
  updateSystemMetrics: (data) => set((state) => ({ 
    systemMetrics: { ...state.systemMetrics, ...data } 
  })),
  
  messages: createInitialMessages(),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: createResetMessages() }),
  
  isProcessing: false,
  setIsProcessing: (b) => set({ isProcessing: b }),
 
  customWallpaper: null,
  setCustomWallpaper: (url) => set({ customWallpaper: url }),

  showSettings: false,
  setShowSettings: (show) => set({ showSettings: show }),

  settingsDocked: false,
  setSettingsDocked: (docked) => set({ settingsDocked: docked }),

  particleEffects: true,
  setParticleEffects: (enabled) => set({ particleEffects: enabled }),
  audioFeedback: false,
  setAudioFeedback: (enabled) => set({ audioFeedback: enabled }),
  terminalFontSize: 15,
  setTerminalFontSize: (size) => set({ terminalFontSize: size }),

  activePalette: 'holographic',
  setActivePalette: (palette) => set({ activePalette: palette }),

  dynamicTheme: null,
  setDynamicTheme: (theme) => set({ dynamicTheme: theme }),

  aiModel: 'gemini-3.1-pro-preview',
  setAiModel: (model) => set({ aiModel: model }),
  systemInstructions: 'Maintain system integrity. Be useful, concise, and clear.',
  setSystemInstructions: (instructions) => set({ systemInstructions: instructions }),
}));
