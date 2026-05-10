export type BaseThemeToken =
  | '--theme-bg-base'
  | '--theme-bg-panel'
  | '--theme-bg-panel-border'
  | '--theme-primary'
  | '--theme-primary-hover'
  | '--theme-primary-text'
  | '--theme-secondary'
  | '--theme-secondary-text'
  | '--theme-success'
  | '--theme-warning'
  | '--theme-danger'
  | '--theme-text-main'
  | '--theme-text-muted';

export type AccentThemeToken =
  | '--theme-accent-triad-1'
  | '--theme-accent-triad-2'
  | '--theme-accent-comp'
  | '--theme-accent-phi-1'
  | '--theme-accent-phi-2';

export type ThemeToken = BaseThemeToken | AccentThemeToken;
export type BaseThemePalette = Record<BaseThemeToken, string>;
export type ThemeVars = Record<ThemeToken, string>;

interface HslColor {
  h: number;
  s: number;
  l: number;
}

function normalizeHex(hex: string) {
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  return hex;
}

function hexToHsl(hex: string): HslColor {
  const normalizedHex = normalizeHex(hex);
  const r = parseInt(normalizedHex.substring(1, 3), 16) / 255;
  const g = parseInt(normalizedHex.substring(3, 5), 16) / 255;
  const b = parseInt(normalizedHex.substring(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number) {
  const normalizedHue = ((h % 360) + 360) % 360;
  const saturation = s / 100;
  const lightness = l / 100;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((normalizedHue / 60) % 2 - 1));
  const m = lightness - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (normalizedHue < 60) {
    r = c;
    g = x;
  } else if (normalizedHue < 120) {
    r = x;
    g = c;
  } else if (normalizedHue < 180) {
    g = c;
    b = x;
  } else if (normalizedHue < 240) {
    g = x;
    b = c;
  } else if (normalizedHue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (value: number) => Math.round((value + m) * 255).toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const GOLDEN_RATIO = 0.618033988749895;

export function generateMathAccents(baseHex: string): Record<AccentThemeToken, string> {
  const fallback = {
    '--theme-accent-triad-1': baseHex,
    '--theme-accent-triad-2': baseHex,
    '--theme-accent-comp': baseHex,
    '--theme-accent-phi-1': baseHex,
    '--theme-accent-phi-2': baseHex,
  };

  if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(baseHex)) {
    return fallback;
  }

  const { h, s, l } = hexToHsl(baseHex);

  return {
    '--theme-accent-triad-1': hslToHex(h + 120, s, l),
    '--theme-accent-triad-2': hslToHex(h + 240, s, l),
    '--theme-accent-comp': hslToHex(h + 180, s, l),
    '--theme-accent-phi-1': hslToHex(h + GOLDEN_RATIO * 360, s, Math.min(l + 10, 90)),
    '--theme-accent-phi-2': hslToHex(h + GOLDEN_RATIO * 2 * 360, s, Math.max(l - 10, 10)),
  };
}

const basePalettes = {
  holographic: {
    '--theme-bg-base': '#0a0b10',
    '--theme-bg-panel': 'rgba(15, 17, 26, 0.5)',
    '--theme-bg-panel-border': 'rgba(138, 91, 199, 0.25)',
    '--theme-primary': '#8A5BC7',
    '--theme-primary-hover': '#A67BEA',
    '--theme-primary-text': '#ffffff',
    '--theme-secondary': '#A3E4D7',
    '--theme-secondary-text': '#051010',
    '--theme-success': '#A9DFBF',
    '--theme-warning': '#F9E79F',
    '--theme-danger': '#F5B7B1',
    '--theme-text-main': '#EAECEE',
    '--theme-text-muted': '#85929E',
  },
  coreHacker: {
    '--theme-bg-base': '#1A1A2E',
    '--theme-bg-panel': 'rgba(37, 37, 66, 0.7)',
    '--theme-bg-panel-border': 'rgba(107, 78, 154, 0.4)',
    '--theme-primary': '#6B4E9A',
    '--theme-primary-hover': '#866BBA',
    '--theme-primary-text': '#ffffff',
    '--theme-secondary': '#00D4FF',
    '--theme-secondary-text': '#000000',
    '--theme-success': '#21c55e',
    '--theme-warning': '#eab308',
    '--theme-danger': '#ef4444',
    '--theme-text-main': '#FFFFFF',
    '--theme-text-muted': '#B0AACA',
  },
  glitchNeon: {
    '--theme-bg-base': '#0F0F23',
    '--theme-bg-panel': 'rgba(24, 24, 48, 0.7)',
    '--theme-bg-panel-border': 'rgba(138, 91, 199, 0.5)',
    '--theme-primary': '#8A5BC7',
    '--theme-primary-hover': '#A67BEA',
    '--theme-primary-text': '#ffffff',
    '--theme-secondary': '#00FFFF',
    '--theme-secondary-text': '#000000',
    '--theme-success': '#21c55e',
    '--theme-warning': '#eab308',
    '--theme-danger': '#FF00FF',
    '--theme-text-main': '#E0E0FF',
    '--theme-text-muted': '#8080B0',
  },
  silverPunk: {
    '--theme-bg-base': '#F8F8FF',
    '--theme-bg-panel': 'rgba(238, 238, 248, 0.8)',
    '--theme-bg-panel-border': 'rgba(181, 158, 200, 0.5)',
    '--theme-primary': '#B59EC8',
    '--theme-primary-hover': '#C0AEE0',
    '--theme-primary-text': '#111',
    '--theme-secondary': '#4FD0FF',
    '--theme-secondary-text': '#111',
    '--theme-success': '#21c55e',
    '--theme-warning': '#eab308',
    '--theme-danger': '#ef4444',
    '--theme-text-main': '#4A4A6B',
    '--theme-text-muted': '#8A8AA8',
  },
  randomFan: {
    '--theme-bg-base': '#121212',
    '--theme-bg-panel': 'rgba(30, 30, 30, 0.7)',
    '--theme-bg-panel-border': 'rgba(125, 90, 255, 0.25)',
    '--theme-primary': '#7D5AFF',
    '--theme-primary-hover': '#9076FF',
    '--theme-primary-text': '#fff',
    '--theme-secondary': '#40E0D0',
    '--theme-secondary-text': '#111',
    '--theme-success': '#21c55e',
    '--theme-warning': '#FFD700',
    '--theme-danger': '#ef4444',
    '--theme-text-main': '#FFD700',
    '--theme-text-muted': '#B8A830',
  },
  pastelDream: {
    '--theme-bg-base': '#F5F0FF',
    '--theme-bg-panel': 'rgba(230, 216, 248, 0.6)',
    '--theme-bg-panel-border': 'rgba(230, 199, 240, 0.6)',
    '--theme-primary': '#E6C7F0',
    '--theme-primary-hover': '#F3DAFA',
    '--theme-primary-text': '#6B4E9A',
    '--theme-secondary': '#B0E0E6',
    '--theme-secondary-text': '#4B8891',
    '--theme-success': '#21c55e',
    '--theme-warning': '#eab308',
    '--theme-danger': '#FFB6D9',
    '--theme-text-main': '#6B4E9A',
    '--theme-text-muted': '#9177BC',
  },
} satisfies Record<string, BaseThemePalette>;

export type PaletteKey = keyof typeof basePalettes;

export const palettes = Object.fromEntries(
  Object.entries(basePalettes).map(([key, palette]) => {
    const mathAccents = generateMathAccents(palette['--theme-primary']);
    return [key, { ...palette, ...mathAccents }];
  })
) as Record<PaletteKey, ThemeVars>;

export function formatPaletteName(key: PaletteKey) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
