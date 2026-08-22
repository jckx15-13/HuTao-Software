import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PaletteKey, ThemeVars } from '../lib/themeEngine';
import { PERSONALISATION_DEFAULTS, normalizePersonalisation } from '../core/defaults/uiDefaults';

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

export interface ThemeState {
  activePalette: PaletteKey;
  customWallpaper: string | null;
  dynamicTheme: Partial<ThemeVars> | null;
  personalisation: Personalisation;
  cursorDesign: string;
  particleEffects: boolean;
  scanlineOverlay: boolean;
  terminalFontSize: number;

  setActivePalette: (palette: PaletteKey) => void;
  setCustomWallpaper: (url: string | null) => void;
  setDynamicTheme: (theme: Partial<ThemeVars> | null) => void;
  updatePersonalisation: (p: Partial<Personalisation>) => void;
  setCursorDesign: (design: string) => void;
  setParticleEffects: (enabled: boolean) => void;
  setScanlineOverlay: (enabled: boolean) => void;
  setTerminalFontSize: (size: number) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      activePalette: 'holographic' as PaletteKey,
      customWallpaper: null,
      dynamicTheme: null,
      personalisation: normalizePersonalisation(PERSONALISATION_DEFAULTS),
      cursorDesign: 'reticle-v1',
      particleEffects: false,
      scanlineOverlay: false,
      terminalFontSize: 15,

      setActivePalette: (activePalette) => set({ activePalette }),
      setCustomWallpaper: (customWallpaper) => set({ customWallpaper }),
      setDynamicTheme: (dynamicTheme) => set({ dynamicTheme }),
      updatePersonalisation: (p) =>
        set((s) => ({ personalisation: normalizePersonalisation({ ...s.personalisation, ...p }) })),
      setCursorDesign: (cursorDesign) => set({ cursorDesign }),
      setParticleEffects: (particleEffects) => set({ particleEffects }),
      setScanlineOverlay: (scanlineOverlay) => set({ scanlineOverlay }),
      setTerminalFontSize: (terminalFontSize) => set({ terminalFontSize })
    }),
    {
      name: 'silver-wolf-v6-theme',
      partialize: (s) => ({
        activePalette: s.activePalette,
        customWallpaper: s.customWallpaper,
        personalisation: s.personalisation,
        cursorDesign: s.cursorDesign,
        particleEffects: s.particleEffects,
        scanlineOverlay: s.scanlineOverlay
      })
    }
  )
);
