/**
 * Startup and fallback defaults for the persisted UI store.
 *
 * Three jobs, in order of how often they matter:
 *
 * 1. **Startup defaults** — one place that declares the first-run value of every
 *    persisted field, instead of those values living inline in the store body
 *    where nothing can read them back.
 * 2. **Fallback on load** — `sanitizePersistedUiState` validates every field
 *    coming out of localStorage. Anything missing, wrong-typed, or out of range
 *    is dropped so the store's own default applies. Previously `migrate` only
 *    guarded against a non-object payload, so a single hand-edited or truncated
 *    field (`cameraSensitivity: "fast"`, `personalisation: null`) booted the app
 *    into a broken layout with no way back short of clearing site data.
 * 3. **Reset** — `buildDefaultUiState` returns a fresh snapshot for the store's
 *    `resetToDefaults` action.
 *
 * Types are imported type-only, so this module and `uiStore` do not form a
 * runtime import cycle.
 */

import { palettes, type PaletteKey } from '../../lib/themeEngine';
import { resolveDeviceProfile, type DeviceClass, type DeviceProfile } from '../layout/deviceProfile';
import type {
  AiModel,
  ChangeLogEntry,
  CosmosBackgroundMode,
  InteractionMode,
  Personalisation,
  SatelliteData
} from '../../store/uiStore';

// ---------------------------------------------------------------------------
// Personalisation
// ---------------------------------------------------------------------------

export const PERSONALISATION_DEFAULTS: Personalisation = {
  panelOpacity: 0.88,
  blurIntensity: 6,
  animationIntensity: 0.35,
  motionReduced: false,
  cornerRadius: 20,
  borderStyle: 'solid',
  shadowIntensity: 0.2,
  chatBubbleStyle: 'solid',
  minimalMode: false,
  iconStyle: 'outlined',
  uiDensity: 'compact',
  fontScale: 1.0,
  accentColor: '',
  fontFamily: 'Inter',
  panelTransitionStyle: 'fade'
};

const BORDER_STYLES: Personalisation['borderStyle'][] = ['subtle', 'glow', 'solid', 'none'];
const BUBBLE_STYLES: Personalisation['chatBubbleStyle'][] = ['glass', 'solid', 'minimal'];
const ICON_STYLES: Personalisation['iconStyle'][] = ['outlined', 'filled'];
const UI_DENSITIES: Personalisation['uiDensity'][] = ['comfortable', 'compact', 'spacious'];
const FONT_FAMILIES: Personalisation['fontFamily'][] = ['Outfit', 'Inter', 'system-ui'];
const PANEL_TRANSITIONS: Personalisation['panelTransitionStyle'][] = ['slide', 'swing-3d', 'fade'];

export const ACTIVE_AI_MODELS: ReadonlySet<AiModel> = new Set<AiModel>([
  'local-assistant',
  'odysseus-local',
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
]);

export function normalizeAiModel(model: unknown): AiModel {
  if (typeof model !== 'string') return 'local-assistant';

  if (model === 'gemini-3-flash') return 'gemini-3-flash-preview';
  if (model === 'gemini-3-pro') return 'gemini-3.1-pro-preview';
  if (model.startsWith('gpt-')) return 'local-assistant';

  return ACTIVE_AI_MODELS.has(model as AiModel) ? (model as AiModel) : 'local-assistant';
}

const clampNumber = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const pickEnum = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

const pickNumber = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? clampNumber(value, min, max) : fallback;

const pickBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const pickString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

export function normalizePersonalisation(
  personalisation?: Partial<Personalisation> | null
): Personalisation {
  const source = personalisation && typeof personalisation === 'object' ? personalisation : {};
  const d = PERSONALISATION_DEFAULTS;

  const minimalMode = pickBoolean(source.minimalMode, d.minimalMode);
  const panelRange = minimalMode ? { min: 0.78, max: 0.98 } : { min: 0.72, max: 0.98 };
  const blurRange = minimalMode ? { min: 0, max: 8 } : { min: 0, max: 16 };

  return {
    panelOpacity: pickNumber(source.panelOpacity, panelRange.min, panelRange.max, d.panelOpacity),
    blurIntensity: pickNumber(source.blurIntensity, blurRange.min, blurRange.max, d.blurIntensity),
    animationIntensity: pickNumber(source.animationIntensity, 0, 1, d.animationIntensity),
    motionReduced: pickBoolean(source.motionReduced, d.motionReduced),
    cornerRadius: pickNumber(source.cornerRadius, 0, 48, d.cornerRadius),
    borderStyle: pickEnum(source.borderStyle, BORDER_STYLES, d.borderStyle),
    shadowIntensity: pickNumber(source.shadowIntensity, 0, 1, d.shadowIntensity),
    chatBubbleStyle: pickEnum(source.chatBubbleStyle, BUBBLE_STYLES, d.chatBubbleStyle),
    minimalMode,
    iconStyle: pickEnum(source.iconStyle, ICON_STYLES, d.iconStyle),
    uiDensity: pickEnum(source.uiDensity, UI_DENSITIES, d.uiDensity),
    fontScale: pickNumber(source.fontScale, 0.75, 1.6, d.fontScale),
    accentColor: pickString(source.accentColor, d.accentColor),
    fontFamily: pickEnum(source.fontFamily, FONT_FAMILIES, d.fontFamily),
    panelTransitionStyle: pickEnum(source.panelTransitionStyle, PANEL_TRANSITIONS, d.panelTransitionStyle)
  };
}

// ---------------------------------------------------------------------------
// Startup layout, per device class
// ---------------------------------------------------------------------------

export type StartupLayout = {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
};

/**
 * First-run panel state per device class.
 *
 * Opening both panels on a phone used to hand the user a screen with no
 * workspace visible at all, which `DockedLayout` then "fixed" by slamming both
 * shut on mount — so a phone booted with no panels and no hint they existed.
 * Small screens now start with the right (context) panel only.
 */
export const STARTUP_LAYOUT_BY_DEVICE: Record<DeviceClass, StartupLayout> = {
  watch: { leftPanelOpen: false, rightPanelOpen: false },
  phone: { leftPanelOpen: false, rightPanelOpen: true },
  phablet: { leftPanelOpen: false, rightPanelOpen: true },
  tablet: { leftPanelOpen: true, rightPanelOpen: true },
  laptop: { leftPanelOpen: true, rightPanelOpen: true },
  desktop: { leftPanelOpen: true, rightPanelOpen: true },
  ultrawide: { leftPanelOpen: true, rightPanelOpen: true }
};

/**
 * Closes the left panel first when a profile cannot host both, since the right
 * panel carries context for the current selection and is the one users land on.
 */
export function enforcePanelBudget(layout: StartupLayout, profile: DeviceProfile): StartupLayout {
  if (profile.maxConcurrentPanels >= 2) return layout;
  if (!(layout.leftPanelOpen && layout.rightPanelOpen)) return layout;
  return { leftPanelOpen: false, rightPanelOpen: true };
}

/**
 * Resolves the startup layout for a viewport, then enforces the profile's
 * `maxConcurrentPanels`. The table above is the intent; this is the guarantee.
 */
export function resolveStartupLayout(profile?: DeviceProfile | null): StartupLayout {
  const resolved = profile ?? resolveDeviceProfile();
  const preferred = STARTUP_LAYOUT_BY_DEVICE[resolved.deviceClass] ?? STARTUP_LAYOUT_BY_DEVICE.laptop;
  return enforcePanelBudget(preferred, resolved);
}

// ---------------------------------------------------------------------------
// Persisted-field defaults
// ---------------------------------------------------------------------------

export type PersistedUiDefaults = {
  activePalette: PaletteKey;
  aiModel: AiModel;
  systemInstructions: string;
  audioFeedback: boolean;
  particleEffects: boolean;
  lastSyncTime: number | null;
  notionEnabled: boolean;
  notionDatabaseId: string;
  personalisation: Personalisation;
  launcherDismissed: boolean;
  interactionMode: InteractionMode;
  scanlineOverlay: boolean;
  cameraSensitivity: number;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  browserUrl: string;
  changeLogs: ChangeLogEntry[];
  showBorders: boolean;
  showTerrain: boolean;
  showRoads: boolean;
  activeSatelliteId: string | null;
  satelliteCategories: Record<string, boolean>;
  satelliteSettings: {
    showTrails: boolean;
    showAllTrails: boolean;
    occludeByGlobe: boolean;
    trailLength: number;
    iconSize: number;
  };
  satelliteData: Record<string, SatelliteData>;
  forceFallback: boolean;
  engineUrlOverride: string;
  imageryProvider: string;
  cursorDesign: string;
  spaceBlendOpacity: number;
  cosmosBackgroundMode: CosmosBackgroundMode;
  wwtBackgroundLayer: string;
  spaceInteractionTarget: 'earth' | 'telescope';
};

export const SATELLITE_CATEGORY_DEFAULTS: Record<string, boolean> = {
  spaceStations: true,
  brightest: true,
  weather: true,
  gps: true,
  earthObs: true,
  starlink: true,
  military: true,
  other: true
};

export const SATELLITE_SETTINGS_DEFAULTS: PersistedUiDefaults['satelliteSettings'] = {
  showTrails: true,
  showAllTrails: false,
  occludeByGlobe: true,
  trailLength: 40,
  iconSize: 18
};

const INTERACTION_MODES: InteractionMode[] = ['chat', 'orbital', 'telescope'];
const COSMOS_MODES: CosmosBackgroundMode[] = ['deep-black', 'sparkling', 'wwt-milkyway'];
const SPACE_TARGETS: PersistedUiDefaults['spaceInteractionTarget'][] = ['earth', 'telescope'];

/**
 * Every persisted field's startup value in one object.
 *
 * `leftPanelOpen` / `rightPanelOpen` here are the desktop baseline — the real
 * values come from `resolveStartupLayout` at store creation, because they depend
 * on the device the app is actually booting on.
 */
export const UI_DEFAULTS: PersistedUiDefaults = {
  activePalette: 'holographic' as PaletteKey,
  aiModel: 'local-assistant',
  systemInstructions: 'You are Silver Wolf VI, a cyberpunk AI companion.',
  audioFeedback: false,
  particleEffects: false,
  lastSyncTime: null,
  notionEnabled: false,
  notionDatabaseId: '',
  personalisation: PERSONALISATION_DEFAULTS,
  launcherDismissed: false,
  interactionMode: 'chat',
  scanlineOverlay: false,
  cameraSensitivity: 1.0,
  leftPanelOpen: true,
  rightPanelOpen: true,
  browserUrl: 'https://nasa.gov',
  changeLogs: [],
  showBorders: false,
  showTerrain: false,
  showRoads: false,
  activeSatelliteId: null,
  satelliteCategories: SATELLITE_CATEGORY_DEFAULTS,
  satelliteSettings: SATELLITE_SETTINGS_DEFAULTS,
  satelliteData: {},
  forceFallback: false,
  engineUrlOverride: '',
  imageryProvider: 'arcgis-world',
  cursorDesign: 'reticle-v1',
  spaceBlendOpacity: 0.35,
  cosmosBackgroundMode: 'wwt-milkyway',
  wwtBackgroundLayer: '3D Solar System View',
  spaceInteractionTarget: 'earth'
};

/**
 * A fresh copy of the defaults, with device-appropriate panel state applied.
 * Collections are cloned so a reset can never alias the shared constant.
 */
export function buildDefaultUiState(profile?: DeviceProfile | null): PersistedUiDefaults {
  const layout = resolveStartupLayout(profile);
  return {
    ...UI_DEFAULTS,
    ...layout,
    personalisation: { ...PERSONALISATION_DEFAULTS },
    changeLogs: [],
    satelliteCategories: { ...SATELLITE_CATEGORY_DEFAULTS },
    satelliteSettings: { ...SATELLITE_SETTINGS_DEFAULTS },
    satelliteData: {}
  };
}

// ---------------------------------------------------------------------------
// Fallback: validate anything coming back out of storage
// ---------------------------------------------------------------------------

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function sanitizeChangeLogs(value: unknown): ChangeLogEntry[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const levels: ChangeLogEntry['level'][] = ['info', 'warning', 'error', 'success', 'primary'];

  const entries = value.filter(isPlainObject).map((entry, index) => ({
    id: pickString(entry.id, `log-restored-${index}`),
    timestamp: pickString(entry.timestamp, ''),
    category: pickString(entry.category, 'SYSTEM'),
    message: pickString(entry.message, ''),
    level: pickEnum(entry.level, levels, 'info')
  }));

  // Matches the cap `addChangeLog` enforces, so a tampered payload cannot grow
  // the log past what the app itself would ever write.
  return entries.slice(0, 100);
}

function sanitizeSatelliteData(value: unknown): Record<string, SatelliteData> | undefined {
  if (!isPlainObject(value)) return undefined;
  const out: Record<string, SatelliteData> = {};

  for (const [id, entry] of Object.entries(value)) {
    if (!isPlainObject(entry)) continue;
    const tle = entry.tle;
    if (!Array.isArray(tle) || !tle.every((line) => typeof line === 'string')) continue;
    const timestamp = entry.timestamp;
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) continue;
    out[id] = { tle: tle as string[], timestamp };
  }

  return out;
}

function sanitizeBooleanRecord(
  value: unknown,
  fallback: Record<string, boolean>
): Record<string, boolean> | undefined {
  if (!isPlainObject(value)) return undefined;
  const out: Record<string, boolean> = { ...fallback };
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'boolean') out[key] = entry;
  }
  return out;
}

/**
 * Per-field validators. A validator returning `undefined` means "unusable —
 * fall back to the default", so adding a field here is the only step needed to
 * bring it under fallback protection.
 */
const FIELD_SANITIZERS: {
  [K in keyof PersistedUiDefaults]: (value: unknown) => PersistedUiDefaults[K] | undefined;
} = {
  activePalette: (v) =>
    typeof v === 'string' && Object.prototype.hasOwnProperty.call(palettes, v)
      ? (v as PaletteKey)
      : undefined,
  aiModel: (v) => (v === undefined ? undefined : normalizeAiModel(v)),
  systemInstructions: (v) => (typeof v === 'string' ? v : undefined),
  audioFeedback: (v) => (typeof v === 'boolean' ? v : undefined),
  particleEffects: (v) => (typeof v === 'boolean' ? v : undefined),
  lastSyncTime: (v) =>
    v === null ? null : typeof v === 'number' && Number.isFinite(v) ? v : undefined,
  notionEnabled: (v) => (typeof v === 'boolean' ? v : undefined),
  notionDatabaseId: (v) => (typeof v === 'string' ? v : undefined),
  personalisation: (v) =>
    v === undefined ? undefined : normalizePersonalisation(v as Partial<Personalisation>),
  launcherDismissed: (v) => (typeof v === 'boolean' ? v : undefined),
  interactionMode: (v) =>
    typeof v === 'string' && INTERACTION_MODES.includes(v as InteractionMode)
      ? (v as InteractionMode)
      : undefined,
  scanlineOverlay: (v) => (typeof v === 'boolean' ? v : undefined),
  cameraSensitivity: (v) =>
    typeof v === 'number' && Number.isFinite(v) ? clampNumber(v, 0.1, 5) : undefined,
  leftPanelOpen: (v) => (typeof v === 'boolean' ? v : undefined),
  rightPanelOpen: (v) => (typeof v === 'boolean' ? v : undefined),
  browserUrl: (v) => (typeof v === 'string' && /^https?:\/\//i.test(v) ? v : undefined),
  changeLogs: sanitizeChangeLogs,
  showBorders: (v) => (typeof v === 'boolean' ? v : undefined),
  showTerrain: (v) => (typeof v === 'boolean' ? v : undefined),
  showRoads: (v) => (typeof v === 'boolean' ? v : undefined),
  activeSatelliteId: (v) => (v === null ? null : typeof v === 'string' ? v : undefined),
  satelliteCategories: (v) => sanitizeBooleanRecord(v, SATELLITE_CATEGORY_DEFAULTS),
  satelliteSettings: (v) => {
    if (!isPlainObject(v)) return undefined;
    const d = SATELLITE_SETTINGS_DEFAULTS;
    return {
      showTrails: pickBoolean(v.showTrails, d.showTrails),
      showAllTrails: pickBoolean(v.showAllTrails, d.showAllTrails),
      occludeByGlobe: pickBoolean(v.occludeByGlobe, d.occludeByGlobe),
      trailLength: pickNumber(v.trailLength, 0, 500, d.trailLength),
      iconSize: pickNumber(v.iconSize, 4, 64, d.iconSize)
    };
  },
  satelliteData: sanitizeSatelliteData,
  forceFallback: (v) => (typeof v === 'boolean' ? v : undefined),
  engineUrlOverride: (v) => (typeof v === 'string' ? v : undefined),
  imageryProvider: (v) => {
    if (typeof v !== 'string' || v.length === 0) return undefined;
    // Retired provider id; the migration used to handle this but a payload from
    // a skipped version can still carry it.
    return v === 'cesium' ? 'arcgis-world' : v;
  },
  cursorDesign: (v) => (typeof v === 'string' && v.length > 0 ? v : undefined),
  spaceBlendOpacity: (v) =>
    typeof v === 'number' && Number.isFinite(v) ? clampNumber(v, 0, 1) : undefined,
  cosmosBackgroundMode: (v) =>
    typeof v === 'string' && COSMOS_MODES.includes(v as CosmosBackgroundMode)
      ? (v as CosmosBackgroundMode)
      : undefined,
  wwtBackgroundLayer: (v) => {
    if (typeof v !== 'string' || v.length === 0) return undefined;
    // 'Visible Imagery' is an Earth layer that renders as a black sphere in the
    // cosmos view. Treated as unusable rather than silently kept.
    return v === 'Visible Imagery' ? undefined : v;
  },
  spaceInteractionTarget: (v) =>
    typeof v === 'string' && SPACE_TARGETS.includes(v as PersistedUiDefaults['spaceInteractionTarget'])
      ? (v as PersistedUiDefaults['spaceInteractionTarget'])
      : undefined
};

export type SanitizeResult = {
  state: Partial<PersistedUiDefaults>;
  /** Fields that were present but unusable, so callers can log or surface them. */
  rejected: string[];
};

/**
 * Validates a persisted payload field by field. Unknown keys are dropped,
 * invalid values are dropped, and the caller merges what survives over the
 * defaults — so a corrupt entry costs one setting, not the whole session.
 */
export function sanitizePersistedUiState(raw: unknown): SanitizeResult {
  if (!isPlainObject(raw)) return { state: {}, rejected: [] };

  const state: Record<string, unknown> = {};
  const rejected: string[] = [];

  for (const [key, sanitize] of Object.entries(FIELD_SANITIZERS)) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;

    let value: unknown;
    try {
      value = (sanitize as (input: unknown) => unknown)(raw[key]);
    } catch {
      value = undefined;
    }

    if (value === undefined) {
      rejected.push(key);
      continue;
    }
    state[key] = value;
  }

  return { state: state as Partial<PersistedUiDefaults>, rejected };
}
