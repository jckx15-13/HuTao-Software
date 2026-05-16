/**
 * MODULE: Settings Slice (Zustand Store)
 * 
 * PURPOSE:
 * Manages user preferences, themes, models, and UI layout flags (sidebar, docked state).
 * Crucially, it handles the logic for persisting user preferences to the browser's localStorage.
 * 
 * WHY LOCALSTORAGE?
 * We want a "local-first" architecture without requiring a backend database or user login.
 * `localStorage` is synchronously available and persists across sessions.
 * 
 * ALTERNATIVE PERSISTENCE PATTERNS:
 * 1. Zustand's built-in `persist` middleware.
 *    Why rejected here? The built-in persist middleware saves the ENTIRE store by default.
 *    Since our store includes transient data (CPU load, network latency, `isProcessing`), 
 *    saving everything would cause weird bugs on reload (e.g., reloading into a stuck "loading" state).
 *    We manually persist *only* what matters.
 */

import { StateCreator } from 'zustand';
import type { PaletteKey, ThemeVars } from '../../lib/themeEngine';

const SETTINGS_STORAGE_KEY = 'silverWolf.settings';

export type AiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash';

// This interface explicitly defines the subset of state we actually want to save to disk.
export interface PersistedSettings {
  activePalette: PaletteKey;
  particleEffects: boolean;
  audioFeedback: boolean;
  terminalFontSize: number;
  aiModel: AiModel;
  systemInstructions: string;
}

export interface SettingsSlice extends PersistedSettings {
  // UI Layout State (NOT persisted)
  customWallpaper: string | null;
  setCustomWallpaper: (url: string | null) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  settingsDocked: boolean;
  setSettingsDocked: (docked: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  dynamicTheme: Partial<ThemeVars> | null;
  setDynamicTheme: (theme: Partial<ThemeVars> | null) => void;

  // Setters for persisted state
  setParticleEffects: (enabled: boolean) => void;
  setAudioFeedback: (enabled: boolean) => void;
  setTerminalFontSize: (size: number) => void;
  setActivePalette: (palette: PaletteKey) => void;
  setAiModel: (model: AiModel) => void;
  setSystemInstructions: (instructions: string) => void;
  rightPanelMode: 'monitor' | 'learning';
  setRightPanelMode: (mode: 'monitor' | 'learning') => void;
}

/**
 * Defensive utility to load settings from storage.
 * SYNTAX NOTE: `try...catch` is mandatory here because `localStorage` can throw exceptions
 * in incognito mode or if storage quotas are exceeded.
 */
function loadPersistedSettings(): Partial<PersistedSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedSettings>;
  } catch {
    return {};
  }
}

const persisted = loadPersistedSettings();

// A generic utility function that grabs the current state and dumps it to disk.
function saveSettings(state: SettingsSlice) {
  try {
    const toSave: PersistedSettings = {
      activePalette: state.activePalette,
      particleEffects: state.particleEffects,
      audioFeedback: state.audioFeedback,
      terminalFontSize: state.terminalFontSize,
      aiModel: state.aiModel,
      systemInstructions: state.systemInstructions,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Silent fail if quota exceeded.
  }
}

/**
 * SYNTAX NOTE: `(set, get) => ({ ... })`
 * We extract `get` so we can read the entire current state inside our setter functions
 * in order to trigger the save routine.
 */
export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (set, get) => ({
  // Defaults pulled from storage, or fallback to sensible defaults using Nullish Coalescing (`??`)
  // WHY `??` instead of `||`?
  // If `persisted.audioFeedback` is strictly `false`, `||` would evaluate to falsy and use the fallback (e.g., `true`),
  // which overrides the user's explicit choice to turn it off. `??` only falls back if the value is `null` or `undefined`.
  particleEffects: persisted.particleEffects ?? true,
  audioFeedback: persisted.audioFeedback ?? false,
  terminalFontSize: persisted.terminalFontSize ?? 15,
  activePalette: persisted.activePalette ?? 'holographic',
  aiModel: persisted.aiModel ?? 'gemini-2.5-flash',
  systemInstructions: persisted.systemInstructions ?? 'You are Silver Wolf VI, a cyberpunk AI companion. Be helpful, concise, and technically precise. Format code with markdown fences.',

  customWallpaper: null,
  showSettings: false,
  settingsDocked: false,
  sidebarOpen: false,
  dynamicTheme: null,

  rightPanelMode: 'monitor',

  setCustomWallpaper: (url) => set({ customWallpaper: url }),
  setShowSettings: (show) => set({ showSettings: show }),
  setSettingsDocked: (docked) => set({ settingsDocked: docked }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDynamicTheme: (theme) => set({ dynamicTheme: theme }),
  setRightPanelMode: (mode) => set({ rightPanelMode: mode }),

  // For the persisting setters, we update state AND immediately trigger a save to disk.
  setParticleEffects: (enabled) => { set({ particleEffects: enabled }); saveSettings(get()); },
  setAudioFeedback: (enabled) => { set({ audioFeedback: enabled }); saveSettings(get()); },
  setTerminalFontSize: (size) => { set({ terminalFontSize: size }); saveSettings(get()); },
  setActivePalette: (palette) => { set({ activePalette: palette }); saveSettings(get()); },
  setAiModel: (model) => { set({ aiModel: model }); saveSettings(get()); },
  setSystemInstructions: (instructions) => { set({ systemInstructions: instructions }); saveSettings(get()); },
});
