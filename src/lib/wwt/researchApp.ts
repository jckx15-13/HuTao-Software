export const WWT_ORIGIN = 'https://web.wwtassets.org';
export const WWT_RESEARCH_APP_URL = `${WWT_ORIGIN}/research/latest/`;
export const WWT_VIEWPORT_ID = 'telescope-viewport-root';
export const WWT_SOLAR_SYSTEM_LAYER = '3D Solar System View';
export const WWT_SKY_LAYER = 'Digitized Sky Survey (Color)';
const WWT_PLANCK_LAYER = 'Planck Thermal Dust';

export const WWT_BACKGROUND_LAYERS = [
  { value: WWT_SKY_LAYER, label: 'Digitized Sky Survey (Color)', description: 'Visible-light survey of the sky.' },
  { value: 'PanSTARRS1 3pi', label: 'Pan-STARRS1', description: 'Optical and near-infrared survey of the sky.' },
  { value: 'RASS: ROSAT All Sky Survey (X-ray)', label: 'ROSAT All-Sky Survey (X-ray)', description: 'All-sky X-ray observations.' },
  { value: WWT_PLANCK_LAYER, label: 'Planck Thermal Dust', description: 'Galactic dust at microwave wavelengths.' },
  { value: 'VLSS: VLA Low-frequency Sky Survey (Radio)', label: 'VLA Low-Frequency Sky Survey', description: 'Low-frequency radio observations.' },
] as const;

export function normalizeWwtBackgroundLayer(value: unknown): string | undefined {
  if (value === 'Planck Dust & Gas') return WWT_PLANCK_LAYER;
  if (value === WWT_SOLAR_SYSTEM_LAYER || value === 'Hubble Space Telescope Imagery') return WWT_SKY_LAYER;
  return WWT_BACKGROUND_LAYERS.find((layer) => layer.value === value)?.value;
}

export const DEFAULT_WWT_OVERLAYS = {
  showConstellationPictures: false,
  showConstellationFigures: true,
  showConstellationLabels: false,
  showConstellationBoundries: false,
  showConstellationSelection: true,
  showGrid: false,
};

export type WwtOverlay = keyof typeof DEFAULT_WWT_OVERLAYS;

export const WWT_CONSTELLATION_COLORS = {
  constellationFigureColor: '#465e80',
  constellationBoundryColor: '#354969',
  constellationSelectionColor: '#8ba9cb',
} as const;

export type WwtConstellationColor = keyof typeof WWT_CONSTELLATION_COLORS;

// The Research App's classic pywwt messages use degrees for outbound coordinates.
export type WwtCommand =
  | { type: 'wwt_ping_pong'; threadId: string; sessionId: string }
  | { event: 'set_viewer_mode'; mode: string }
  | { event: 'set_background_by_name'; name: string }
  | { event: 'center_on_coordinates'; ra: number; dec: number; fov: number; instant: boolean }
  | { event: 'set_datetime'; isot: string }
  | { event: 'pause_time' }
  | { event: 'resume_time'; rate: number }
  | { event: 'setting_set'; setting: WwtOverlay; value: boolean }
  | { event: 'setting_set'; setting: WwtConstellationColor; value: string }
  | { event: 'load_image_collection'; url: string; threadId: string };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function readWwtTelemetry(message: Record<string, unknown>) {
  const { type, raRad, decRad, rollDeg, fovDeg } = message;
  if (type !== 'wwt_view_state' || !isFiniteNumber(raRad) ||
    !isFiniteNumber(decRad) || !isFiniteNumber(fovDeg) || fovDeg <= 0) {
    return null;
  }

  const raHours = raRad * 12 / Math.PI;
  return {
    ra: ((raHours % 24) + 24) % 24,
    dec: decRad * 180 / Math.PI,
    roll: isFiniteNumber(rollDeg) ? rollDeg : null,
    fov: fovDeg,
  };
}
