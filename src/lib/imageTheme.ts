import { generateMathAccents, type ThemeVars } from './themeEngine';

interface ColorSample {
  r: number;
  g: number;
  b: number;
  hex: string;
  luminance: number;
  saturation: number;
}

const SAMPLE_SIZE = 72;
const MIN_ALPHA = 128;

export async function extractThemeFromImage(url: string): Promise<Partial<ThemeVars>> {
  const image = await loadImage(url);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Canvas is not available for theme extraction.');
  }

  const scale = Math.min(SAMPLE_SIZE / image.naturalWidth, SAMPLE_SIZE / image.naturalHeight, 1);
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const samples: ColorSample[] = [];

  for (let index = 0; index < imageData.length; index += 4) {
    const alpha = imageData[index + 3];
    if (alpha < MIN_ALPHA) continue;

    samples.push(createSample(imageData[index], imageData[index + 1], imageData[index + 2]));
  }

  if (samples.length === 0) {
    throw new Error('No usable colors found in the selected image.');
  }

  const vibrant = pickSample(samples, (sample) => sample.saturation * 1.3 + balanceScore(sample.luminance, 0.55));
  const lightVibrant = pickSample(samples, (sample) => sample.luminance * 1.1 + sample.saturation);
  const muted = pickSample(samples, (sample) => balanceScore(sample.saturation, 0.32) + balanceScore(sample.luminance, 0.5));
  const darkMuted = pickSample(samples, (sample) => (1 - sample.luminance) * 1.25 + balanceScore(sample.saturation, 0.28));

  return {
    '--theme-bg-base': darkMuted.hex,
    '--theme-bg-panel': `color-mix(in srgb, ${darkMuted.hex} 80%, transparent)`,
    '--theme-bg-panel-border': `color-mix(in srgb, ${vibrant.hex} 30%, transparent)`,
    '--theme-primary': vibrant.hex,
    '--theme-primary-hover': lightVibrant.hex,
    '--theme-primary-text': readableTextColor(vibrant),
    '--theme-secondary': lightVibrant.hex,
    '--theme-secondary-text': readableTextColor(lightVibrant),
    '--theme-success': '#A9DFBF',
    '--theme-warning': muted.hex,
    '--theme-danger': '#F5B7B1',
    '--theme-text-main': readableTextColor(darkMuted),
    '--theme-text-muted': muted.hex,
    ...generateMathAccents(vibrant.hex),
  };
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Selected image could not be loaded.'));
    image.src = url;
  });
}

function createSample(r: number, g: number, b: number): ColorSample {
  const { saturation } = rgbToHsl(r, g, b);

  return {
    r,
    g,
    b,
    hex: rgbToHex(r, g, b),
    luminance: relativeLuminance(r, g, b),
    saturation,
  };
}

function pickSample(samples: ColorSample[], score: (sample: ColorSample) => number) {
  return samples.reduce((best, sample) => (score(sample) > score(best) ? sample : best), samples[0]);
}

function balanceScore(value: number, target: number) {
  return 1 - Math.min(Math.abs(value - target), 1);
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return { saturation, lightness };
}

function relativeLuminance(r: number, g: number, b: number) {
  const [red, green, blue] = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function readableTextColor(sample: ColorSample) {
  return sample.luminance > 0.52 ? '#111111' : '#ffffff';
}
