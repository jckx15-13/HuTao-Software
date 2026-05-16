import basePalettes from '../data/palettes.json';

export type BaseThemeToken =
  | '--theme-bg-base' | '--theme-bg-panel' | '--theme-bg-panel-border'
  | '--theme-primary' | '--theme-primary-hover' | '--theme-primary-text'
  | '--theme-secondary' | '--theme-secondary-text'
  | '--theme-success' | '--theme-warning' | '--theme-danger'
  | '--theme-text-main' | '--theme-text-muted';

export type AccentThemeToken =
  | '--theme-accent-triad-1' | '--theme-accent-triad-2' | '--theme-accent-comp'
  | '--theme-accent-phi-1' | '--theme-accent-phi-2';

export type ThemeToken = BaseThemeToken | AccentThemeToken;
export type ThemeVars = Record<ThemeToken, string>;

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateMathAccents(baseHex: string): Record<AccentThemeToken, string> {
  const { h, s, l } = hexToHsl(baseHex);
  const phi = 0.61803398875;
  return {
    '--theme-accent-triad-1': hslToHex(h + 120, s, l),
    '--theme-accent-triad-2': hslToHex(h + 240, s, l),
    '--theme-accent-comp': hslToHex(h + 180, s, l),
    '--theme-accent-phi-1': hslToHex(h + phi * 360, s, Math.min(l + 10, 90)),
    '--theme-accent-phi-2': hslToHex(h + phi * 2 * 360, s, Math.max(l - 10, 10)),
  };
}

export const palettes = Object.fromEntries(
  Object.entries(basePalettes).map(([key, palette]) => [
    key, 
    { ...palette, ...generateMathAccents(palette['--theme-primary']) }
  ])
) as Record<string, ThemeVars>;

export type PaletteKey = keyof typeof basePalettes;
export const formatPaletteName = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, l => l.toUpperCase());

