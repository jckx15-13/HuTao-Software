/**
 * Device profile resolution — the single source of truth for responsive layout.
 *
 * Before this module, breakpoints were scattered and inconsistent: `useIsMobile`
 * used 768px, `panelGeometry` used 760px, `DockedLayout` used 760px and 1280px,
 * and the telemetry aside used a bare `xl:` Tailwind prefix. A viewport at 762px
 * was simultaneously "mobile" (hooks) and "desktop" (geometry), which is how the
 * centre column ended up rendering underneath fixed side panels.
 *
 * Everything responsive now derives from `resolveDeviceProfile`. Add a device
 * class here and every consumer picks it up.
 */

export type DeviceClass = 'watch' | 'phone' | 'phablet' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';

/**
 * Coarse 3-bucket grouping of `DeviceClass`, for consumers that want a chrome
 * density tier (button/label verbosity, HUD padding) rather than the full
 * 7-way width classification. Derived from `DeviceClass`, not a second set
 * of width thresholds — see `resolveChromeTier`.
 */
export type ChromeTier = 'compact' | 'standard' | 'expansive';

export type Orientation = 'portrait' | 'landscape';

/** How side panels present themselves at this size. */
export type PanelPresentation =
  /** Full-bleed sheet covering the workspace. Watches and small phones. */
  | 'fullbleed-sheet'
  /** Inset sheet floating over the workspace; stacks vertically when two are open. */
  | 'stacked-sheet'
  /** Docked beside the workspace; the centre column reserves a rail for it. */
  | 'docked';

export type ViewportLike = {
  width: number;
  height: number;
};

export type DeviceProfile = {
  deviceClass: DeviceClass;
  orientation: Orientation;
  /** True when the primary pointer is touch-like, so hit targets need to grow. */
  coarsePointer: boolean;
  panelPresentation: PanelPresentation;
  /** How many side panels may be open at once. Layout enforces this. */
  maxConcurrentPanels: 1 | 2;
  /** True when the centre column must reserve horizontal rails for side panels. */
  reservesRail: boolean;
  /** True when the passive telemetry aside has room to render. */
  showsPassiveTelemetry: boolean;
  /** Distance from the viewport edge to a panel edge, in px. */
  edgeInsetPx: number;
  /** Resolved width of a single side panel, in px. */
  panelWidthPx: number;
  topInsetPx: number;
  bottomInsetPx: number;
  /** Suggested multiplier for chrome density (font size, control padding). */
  chromeScale: number;
  /** Coarse 3-bucket grouping of `deviceClass` — see `ChromeTier`. */
  chromeTier: ChromeTier;
};

const CHROME_TIER_BY_CLASS: Record<DeviceClass, ChromeTier> = {
  watch: 'compact',
  phone: 'compact',
  phablet: 'compact',
  tablet: 'standard',
  laptop: 'standard',
  desktop: 'expansive',
  ultrawide: 'expansive'
};

/** Maps a `DeviceClass` to its `ChromeTier` bucket. No new width thresholds — reuses `resolveDeviceClass`. */
export function resolveChromeTier(deviceClass: DeviceClass): ChromeTier {
  return CHROME_TIER_BY_CLASS[deviceClass] ?? 'standard';
}

export type DeviceClassSpec = {
  /** Inclusive lower bound of the class, in CSS px. */
  minWidth: number;
  /** Panel width as a fraction of viewport width, before clamping. */
  panelWidthRatio: number;
  panelWidthMinPx: number;
  panelWidthMaxPx: number;
  edgeInsetRatio: number;
  edgeInsetMinPx: number;
  edgeInsetMaxPx: number;
  topInsetRatio: number;
  topInsetMinPx: number;
  topInsetMaxPx: number;
  bottomInsetRatio: number;
  bottomInsetMinPx: number;
  bottomInsetMaxPx: number;
  chromeScale: number;
};

/**
 * Ordered widest-first so `resolveDeviceClass` can return on first match.
 *
 * `minWidth` boundaries are inclusive: exactly 760px is a `tablet`, not a
 * `phablet`. Keep the list sorted — the resolver relies on the ordering.
 */
export const DEVICE_CLASS_SPECS: ReadonlyArray<readonly [DeviceClass, DeviceClassSpec]> = [
  [
    'ultrawide',
    {
      minWidth: 1920,
      panelWidthRatio: 0.2,
      panelWidthMinPx: 320,
      panelWidthMaxPx: 520,
      edgeInsetRatio: 0.015,
      edgeInsetMinPx: 24,
      edgeInsetMaxPx: 40,
      topInsetRatio: 0.075,
      topInsetMinPx: 32,
      topInsetMaxPx: 104,
      bottomInsetRatio: 0.07,
      bottomInsetMinPx: 28,
      bottomInsetMaxPx: 96,
      chromeScale: 1.05
    }
  ],
  [
    'desktop',
    {
      minWidth: 1440,
      panelWidthRatio: 0.26,
      panelWidthMinPx: 300,
      panelWidthMaxPx: 460,
      edgeInsetRatio: 0.02,
      edgeInsetMinPx: 20,
      edgeInsetMaxPx: 32,
      topInsetRatio: 0.08,
      topInsetMinPx: 30,
      topInsetMaxPx: 96,
      bottomInsetRatio: 0.075,
      bottomInsetMinPx: 26,
      bottomInsetMaxPx: 88,
      chromeScale: 1
    }
  ],
  [
    'laptop',
    {
      minWidth: 1024,
      panelWidthRatio: 0.29,
      panelWidthMinPx: 280,
      panelWidthMaxPx: 420,
      edgeInsetRatio: 0.025,
      edgeInsetMinPx: 14,
      edgeInsetMaxPx: 24,
      topInsetRatio: 0.08,
      topInsetMinPx: 28,
      topInsetMaxPx: 96,
      bottomInsetRatio: 0.075,
      bottomInsetMinPx: 24,
      bottomInsetMaxPx: 88,
      chromeScale: 1
    }
  ],
  [
    'tablet',
    {
      minWidth: 760,
      panelWidthRatio: 0.34,
      panelWidthMinPx: 260,
      panelWidthMaxPx: 380,
      edgeInsetRatio: 0.025,
      edgeInsetMinPx: 14,
      edgeInsetMaxPx: 22,
      topInsetRatio: 0.07,
      topInsetMinPx: 24,
      topInsetMaxPx: 72,
      bottomInsetRatio: 0.065,
      bottomInsetMinPx: 20,
      bottomInsetMaxPx: 64,
      chromeScale: 1
    }
  ],
  [
    'phablet',
    {
      minWidth: 600,
      panelWidthRatio: 0.92,
      panelWidthMinPx: 240,
      panelWidthMaxPx: 640,
      edgeInsetRatio: 0.025,
      edgeInsetMinPx: 12,
      edgeInsetMaxPx: 18,
      topInsetRatio: 0.05,
      topInsetMinPx: 16,
      topInsetMaxPx: 48,
      bottomInsetRatio: 0.05,
      bottomInsetMinPx: 14,
      bottomInsetMaxPx: 44,
      chromeScale: 0.96
    }
  ],
  [
    'phone',
    {
      // 340px, not 380px: the iPhone SE reports 375 and a great many Android
      // handsets report 360. Both are phones, and classing them as watches gave
      // them the chromeless full-bleed sheet meant for a 200px wrist display.
      minWidth: 340,
      panelWidthRatio: 1,
      panelWidthMinPx: 200,
      panelWidthMaxPx: 600,
      edgeInsetRatio: 0.025,
      edgeInsetMinPx: 8,
      edgeInsetMaxPx: 14,
      topInsetRatio: 0.04,
      topInsetMinPx: 10,
      topInsetMaxPx: 32,
      bottomInsetRatio: 0.04,
      bottomInsetMinPx: 10,
      bottomInsetMaxPx: 28,
      chromeScale: 0.92
    }
  ],
  [
    'watch',
    {
      // Floor of the ladder. Anything narrower than `phone` lands here, including
      // 1px-wide viewports during window animations, hence the min of 0.
      minWidth: 0,
      panelWidthRatio: 1,
      panelWidthMinPx: 1,
      panelWidthMaxPx: 380,
      edgeInsetRatio: 0.01,
      edgeInsetMinPx: 0,
      edgeInsetMaxPx: 6,
      topInsetRatio: 0.02,
      topInsetMinPx: 0,
      topInsetMaxPx: 12,
      bottomInsetRatio: 0.02,
      bottomInsetMinPx: 0,
      bottomInsetMaxPx: 12,
      chromeScale: 0.8
    }
  ]
];

const SPEC_BY_CLASS = new Map<DeviceClass, DeviceClassSpec>(
  DEVICE_CLASS_SPECS.map(([deviceClass, spec]) => [deviceClass, spec])
);

/** Widths at or above this dock panels beside the workspace instead of over it. */
export const DOCKED_LAYOUT_MIN_WIDTH = 760;

/**
 * Below this, a single panel takes the whole screen — no inset, no chrome.
 * Deliberately aligned with the `phone` lower bound so full-bleed is reserved
 * for wrist-sized displays; phones still get an inset sheet.
 */
export const FULLBLEED_MAX_WIDTH = 340;

export const DEFAULT_VIEWPORT: ViewportLike = { width: 1280, height: 720 };

const clampPx = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.min(Math.max(Math.round(value), lo), hi);
};

/**
 * The real viewport, when there is a DOM to ask.
 *
 * Callers outside React — store initialisation, persist `merge` — have no
 * `useViewportSize` to hand. Falling back to `DEFAULT_VIEWPORT` there silently
 * treated every device as a 1280×720 desktop, which is exactly the case that
 * needs to be right: it decides which panels a phone opens on launch.
 */
export function readWindowViewport(): ViewportLike | null {
  if (typeof window === 'undefined') return null;

  const visual = window.visualViewport;
  const width = visual?.width ?? window.innerWidth;
  const height = visual?.height ?? window.innerHeight;

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/** Coerces anything into a usable viewport, so a NaN width can't cascade into NaN CSS. */
export function normalizeViewport(viewport?: Partial<ViewportLike> | null): ViewportLike {
  const fallback = readWindowViewport() ?? DEFAULT_VIEWPORT;
  const width = Number(viewport?.width);
  const height = Number(viewport?.height);
  return {
    width: Number.isFinite(width) && width > 0 ? Math.round(width) : fallback.width,
    height: Number.isFinite(height) && height > 0 ? Math.round(height) : fallback.height
  };
}

export function resolveDeviceClass(width: number): DeviceClass {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : DEFAULT_VIEWPORT.width;
  for (const [deviceClass, spec] of DEVICE_CLASS_SPECS) {
    if (safeWidth >= spec.minWidth) return deviceClass;
  }
  return 'watch';
}

export function getDeviceClassSpec(deviceClass: DeviceClass): DeviceClassSpec {
  return SPEC_BY_CLASS.get(deviceClass) ?? SPEC_BY_CLASS.get('laptop')!;
}

function detectCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

function resolvePanelPresentation(deviceClass: DeviceClass, viewport: ViewportLike): PanelPresentation {
  if (viewport.width < FULLBLEED_MAX_WIDTH) return 'fullbleed-sheet';
  if (viewport.width < DOCKED_LAYOUT_MIN_WIDTH) return 'stacked-sheet';

  // A short landscape tablet (or a half-height desktop window) has no vertical
  // room to dock a full-height panel beside the workspace without crushing it.
  if (deviceClass === 'tablet' && viewport.height < 520 && viewport.width < 900) {
    return 'stacked-sheet';
  }

  return 'docked';
}

function resolveMaxConcurrentPanels(
  presentation: PanelPresentation,
  viewport: ViewportLike,
  orientation: Orientation
): 1 | 2 {
  // A fullbleed sheet covers the screen; a second one would be invisible.
  if (presentation === 'fullbleed-sheet') return 1;

  // Stacked sheets split the height between them. Below ~560px each half is
  // shorter than a single list row plus its header, so allow only one.
  if (presentation === 'stacked-sheet') {
    return viewport.height >= 560 ? 2 : 1;
  }

  // Docked: two panels plus a usable centre column need real width. In portrait
  // on a narrow tablet the centre column would be squeezed to nothing.
  if (orientation === 'portrait' && viewport.width < 900) return 1;
  return viewport.width >= 900 ? 2 : 1;
}

function resolvePanelWidthPx(
  viewport: ViewportLike,
  spec: DeviceClassSpec,
  presentation: PanelPresentation,
  edgeInsetPx: number,
  dualPanels: boolean
): number {
  // Sheets (fullbleed or stacked) span the usable width; stacking is vertical,
  // so a second open panel does not narrow the first.
  if (presentation !== 'docked') {
    return Math.max(1, viewport.width - edgeInsetPx * 2);
  }

  const preferredPx = clampPx(viewport.width * spec.panelWidthRatio, spec.panelWidthMinPx, spec.panelWidthMaxPx);

  // Reserve a centre column so two docked panels can never meet in the middle.
  const centreGutterPx = dualPanels ? 40 : 24;
  const availablePx = dualPanels
    ? Math.max(1, Math.floor((viewport.width - edgeInsetPx * 2 - centreGutterPx) / 2))
    : Math.max(1, viewport.width - edgeInsetPx * 2 - centreGutterPx);

  return Math.min(preferredPx, availablePx);
}

export type ResolveDeviceProfileOptions = {
  /** Overrides pointer detection. Supply in tests and non-DOM callers. */
  coarsePointer?: boolean;
  /** Both panels open changes how wide each docked panel can be. Defaults to false. */
  dualPanels?: boolean;
};

export function resolveDeviceProfile(
  rawViewport?: Partial<ViewportLike> | null,
  options: ResolveDeviceProfileOptions = {}
): DeviceProfile {
  const viewport = normalizeViewport(rawViewport);
  const deviceClass = resolveDeviceClass(viewport.width);
  const spec = getDeviceClassSpec(deviceClass);
  const orientation: Orientation = viewport.height >= viewport.width ? 'portrait' : 'landscape';
  const panelPresentation = resolvePanelPresentation(deviceClass, viewport);
  const dualPanels = options.dualPanels === true;

  const edgeInsetPx = clampPx(viewport.width * spec.edgeInsetRatio, spec.edgeInsetMinPx, spec.edgeInsetMaxPx);

  return {
    deviceClass,
    orientation,
    coarsePointer: options.coarsePointer ?? detectCoarsePointer(),
    panelPresentation,
    maxConcurrentPanels: resolveMaxConcurrentPanels(panelPresentation, viewport, orientation),
    reservesRail: panelPresentation === 'docked',
    showsPassiveTelemetry: panelPresentation === 'docked' && viewport.width >= 1280,
    edgeInsetPx,
    panelWidthPx: resolvePanelWidthPx(viewport, spec, panelPresentation, edgeInsetPx, dualPanels),
    topInsetPx: clampPx(viewport.height * spec.topInsetRatio, spec.topInsetMinPx, spec.topInsetMaxPx),
    bottomInsetPx: clampPx(viewport.height * spec.bottomInsetRatio, spec.bottomInsetMinPx, spec.bottomInsetMaxPx),
    chromeScale: spec.chromeScale,
    chromeTier: resolveChromeTier(deviceClass)
  };
}

/**
 * `resolveChromeTier`, but for a caller that already knows the *net* width
 * available (e.g. the space-view centre column after subtracting docked rail
 * widths) rather than the full window width. Used by `GoogleEarthRemix` so
 * its chrome density reflects the room it actually has, not the window's.
 */
export function resolveChromeTierForWidth(netWidthPx: number): ChromeTier {
  return resolveChromeTier(resolveDeviceClass(netWidthPx));
}
