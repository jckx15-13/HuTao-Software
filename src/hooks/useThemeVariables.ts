import { useEffect, useMemo, type CSSProperties } from 'react';
import { palettes, type ThemeVars } from '../lib/themeEngine';
import { useUIStore } from '../store/uiStore';

interface AppliedTheme {
  appStyle: CSSProperties;
  isHighLoad: boolean;
}

export function useThemeVariables(): AppliedTheme {
  const customWallpaper = useUIStore((state) => state.customWallpaper);
  const activePalette = useUIStore((state) => state.activePalette);
  const dynamicTheme = useUIStore((state) => state.dynamicTheme);
  const cpuLoad = useUIStore((state) => state.cpuLoad);

  const currentPalette = useMemo<ThemeVars>(() => {
    const basePalette = palettes[activePalette] || palettes.holographic;
    return customWallpaper && dynamicTheme ? { ...basePalette, ...dynamicTheme } : basePalette;
  }, [activePalette, customWallpaper, dynamicTheme]);

  useEffect(() => {
    Object.entries(currentPalette).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
      document.body.style.setProperty(key, value);
    });
  }, [currentPalette]);

  const appStyle = useMemo<CSSProperties>(() => {
    const themeStyle = currentPalette as CSSProperties;

    if (!customWallpaper) {
      return themeStyle;
    }

    return {
      ...themeStyle,
      backgroundImage: `linear-gradient(color-mix(in srgb, var(--theme-bg-base) 54%, transparent), color-mix(in srgb, var(--theme-bg-base) 72%, transparent)), url(${customWallpaper})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    };
  }, [currentPalette, customWallpaper]);

  return {
    appStyle,
    isHighLoad: cpuLoad > 0.8,
  };
}
