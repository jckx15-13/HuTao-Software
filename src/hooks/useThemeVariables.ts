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
  const personalisation = useUIStore((state) => state.personalisation);

  const currentPalette = useMemo<ThemeVars>(() => {
    const basePalette = palettes[activePalette] || palettes.holographic;
    return customWallpaper && dynamicTheme ? { ...basePalette, ...dynamicTheme } : basePalette;
  }, [activePalette, customWallpaper, dynamicTheme]);

  useEffect(() => {
    Object.entries(currentPalette).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
      document.body.style.setProperty(key, value);
    });

    // Apply personalisation tokens
    const root = document.documentElement;
    root.style.setProperty('--ui-opacity', personalisation.panelOpacity.toString());
    root.style.setProperty('--ui-blur', `${personalisation.blurIntensity}px`);
    root.style.setProperty('--ui-radius', personalisation.cornerRadius.toString());
    root.style.setProperty('--ui-shadow-intensity', personalisation.shadowIntensity.toString());
    root.style.setProperty('--ui-animation-speed', personalisation.animationIntensity.toString());
    root.style.setProperty('--ui-font-scale', personalisation.fontScale.toString());
    
    // Convert UI density to row height
    const densityMap = { compact: '32px', comfortable: '38px', spacious: '44px' };
    root.style.setProperty('--ui-density-row-height', densityMap[personalisation.uiDensity] || '38px');
    
    // Border opacity scale
    const borderOpacity = personalisation.borderStyle === 'solid' ? '0.25' : 
                          personalisation.borderStyle === 'glow' ? '0.15' : 
                          personalisation.borderStyle === 'none' ? '0' : '0.08';
    root.style.setProperty('--ui-border-opacity', borderOpacity);

    // Apply global border style class
    document.body.classList.remove('border-style-subtle', 'border-style-glow', 'border-style-solid', 'border-style-none');
    document.body.classList.add(`border-style-${personalisation.borderStyle}`);
  }, [currentPalette, personalisation]);

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
