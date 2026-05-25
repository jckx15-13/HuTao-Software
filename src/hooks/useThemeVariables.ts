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
  const personalisation = useUIStore((state) => state.personalisation) || {
    panelOpacity: 0.75,
    blurIntensity: 16,
    animationIntensity: 0.7,
    motionReduced: false,
    cornerRadius: 12,
    borderStyle: 'subtle',
    shadowIntensity: 0.5,
    accentColor: '',
    fontFamily: 'Outfit',
    uiDensity: 'comfortable',
    fontScale: 1.0,
  };

  const currentPalette = useMemo<ThemeVars>(() => {
    const basePalette = palettes[activePalette] || palettes.hsrOrbital;
    const palette = customWallpaper && dynamicTheme ? { ...basePalette, ...dynamicTheme } as ThemeVars : basePalette;

    // If user set an accent color override, apply it
    if (personalisation.accentColor) {
      return { ...palette, '--theme-primary': personalisation.accentColor } as ThemeVars;
    }
    return palette;
  }, [activePalette, customWallpaper, dynamicTheme, personalisation.accentColor]);

  // Apply theme palette CSS vars
  useEffect(() => {
    Object.entries(currentPalette).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
      document.body.style.setProperty(key, value as string);
    });
  }, [currentPalette]);

  // Apply personalisation CSS vars
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ui-opacity', String(personalisation.panelOpacity));

    const isHeadless = typeof window !== 'undefined' && (
      /HeadlessChrome/i.test(navigator.userAgent) ||
      navigator.webdriver ||
      window.location.search.includes('fallback')
    );
    const blurVal = isHeadless ? 0 : personalisation.blurIntensity;
    root.style.setProperty('--ui-blur', `${blurVal}px`);
    root.style.setProperty('--ui-radius', String(personalisation.cornerRadius));
    root.style.setProperty('--ui-shadow-intensity', String(personalisation.shadowIntensity));
    root.style.setProperty('--ui-animation-speed', String(personalisation.animationIntensity > 0 ? 1 / personalisation.animationIntensity : 0));
    root.style.setProperty('--ui-font-scale', String(personalisation.fontScale));

    // Density
    const rowHeight = personalisation.uiDensity === 'compact' ? 28 : personalisation.uiDensity === 'spacious' ? 44 : 36;
    root.style.setProperty('--ui-density-row-height', `${rowHeight}px`);

    // Border style
    const borderOpacity = personalisation.borderStyle === 'none' ? 0
      : personalisation.borderStyle === 'subtle' ? 0.08
      : personalisation.borderStyle === 'solid' ? 0.2
      : 0.12; // glow handled separately
    root.style.setProperty('--ui-border-opacity', String(borderOpacity));

    root.classList.remove('border-style-none', 'border-style-subtle', 'border-style-solid', 'border-style-glow');
    root.classList.add(`border-style-${personalisation.borderStyle}`);

    // Font family
    const fontMap = {
      'Outfit': "'Outfit', 'Inter', system-ui, sans-serif",
      'Inter': "'Inter', 'Outfit', system-ui, sans-serif",
      'system-ui': "system-ui, -apple-system, sans-serif",
    };
    root.style.setProperty('--font-sans', fontMap[personalisation.fontFamily] || fontMap['Outfit']);

    // Reduced motion
    if (personalisation.motionReduced) {
      root.classList.add('motion-reduced');
    } else {
      root.classList.remove('motion-reduced');
    }
  }, [personalisation]);

  const appStyle = useMemo<CSSProperties>(() => {
    const themeStyle = currentPalette as unknown as CSSProperties;

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
