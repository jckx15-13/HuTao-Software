import { resolveDeviceProfile, type DeviceProfile, type ViewportLike } from '../deviceProfile';

/**
 * Named, mutually exclusive regions of the workspace.
 *
 * Every floating chrome element claims exactly one slot. The engine guarantees
 * no two occupied slots intersect, which is why components must not hardcode
 * their own offsets — a component that positions itself sits outside the
 * guarantee, and that is exactly how the pre-engine layout ended up rendering
 * the centre column underneath both sidebars.
 */
export type SlotName =
  | 'topBar'
  | 'leftRail'
  | 'rightRail'
  | 'hudTop'
  | 'hudBottom'
  | 'centreStage'
  | 'touchDock';

export type SlotRect = Readonly<{
  top: number;
  left: number;
  width: number;
  height: number;
}>;

export type SafeArea = Readonly<{
  top: number;
  right: number;
  bottom: number;
  left: number;
}>;

export type InteractionMode = 'chat' | 'orbital' | 'telescope';

export type LayoutInput = Readonly<{
  viewport: ViewportLike;
  safeArea?: SafeArea;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  topBarOpen: boolean;
  timelineOpen: boolean;
  interactionMode: InteractionMode;
  coarsePointer?: boolean;
  /** Supply a precomputed profile to avoid resolving it twice in one render. */
  profile?: DeviceProfile;
}>;

export type LayoutResult = Readonly<{
  /** null means the slot is deliberately hidden at this size, not merely empty. */
  slots: Readonly<Record<SlotName, SlotRect | null>>;
  profile: DeviceProfile;
  /** Slots dropped to protect the stage, in the order they were dropped. */
  hidden: readonly SlotName[];
}>;

/**
 * Narrowest the centre stage may become before the engine starts hiding chrome.
 *
 * Measured against the real breakpoint table: at 820x1180 with both panels
 * docked the rails take 300px each, leaving a 220px stage. A layout that only
 * shrinks keeps starving the stage as chrome is added, so past this threshold
 * the engine hides a rail outright instead of shrinking further.
 */
export const MIN_STAGE_WIDTH_PX = 360;

/** Same principle vertically: below this the stage cannot show useful content. */
export const MIN_STAGE_HEIGHT_PX = 240;

export const TOP_BAR_HEIGHT_PX = 56;
export const HUD_TOP_HEIGHT_PX = 96;
export const HUD_BOTTOM_HEIGHT_PX = 72;
export const TOUCH_DOCK_SIZE_PX = 96;

const NO_SAFE_AREA: SafeArea = { top: 0, right: 0, bottom: 0, left: 0 };

/** Mutable working box; only ever narrowed, never grown. */
type Residual = { top: number; left: number; right: number; bottom: number };

const widthOf = (box: Residual): number => Math.max(0, box.right - box.left);
const heightOf = (box: Residual): number => Math.max(0, box.bottom - box.top);

function rectFrom(box: Residual): SlotRect {
  return { top: box.top, left: box.left, width: widthOf(box), height: heightOf(box) };
}

/**
 * True when two rects share any area. Zero-area rects never intersect anything,
 * so a slot collapsed to 0 width is not reported as a collision.
 */
export function rectsIntersect(a: SlotRect, b: SlotRect): boolean {
  if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) return false;
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

/**
 * The engine's core invariant, exposed so tests assert it directly rather than
 * trusting the derivation by inspection.
 *
 * @throws {Error} naming both slots when any two occupied slots overlap.
 */
export function assertNoIntersection(slots: LayoutResult['slots']): void {
  const occupied = (Object.entries(slots) as Array<[SlotName, SlotRect | null]>).filter(
    (entry): entry is [SlotName, SlotRect] => entry[1] !== null
  );

  for (let i = 0; i < occupied.length; i += 1) {
    for (let j = i + 1; j < occupied.length; j += 1) {
      const [nameA, rectA] = occupied[i];
      const [nameB, rectB] = occupied[j];
      if (rectsIntersect(rectA, rectB)) {
        throw new Error(
          `Layout slots "${nameA}" and "${nameB}" intersect: ` +
            `${JSON.stringify(rectA)} vs ${JSON.stringify(rectB)}`
        );
      }
    }
  }
}

/**
 * Resolve every slot rect for one viewport state.
 *
 * Slots are carved out of a single residual box that only ever shrinks, so two
 * slots cannot occupy the same pixels by construction — the guarantee comes from
 * the derivation order, not from after-the-fact collision checks.
 *
 * Rails are dropped rather than shrunk once the stage would fall below
 * `MIN_STAGE_WIDTH_PX`; the dropped panel is expected to present as an overlay
 * sheet instead, which is what `DeviceProfile.panelPresentation` already models.
 */
export function resolveLayout(input: LayoutInput): LayoutResult {
  const { viewport, leftPanelOpen, rightPanelOpen, topBarOpen, timelineOpen } = input;
  const safeArea = input.safeArea ?? NO_SAFE_AREA;

  const profile =
    input.profile ??
    resolveDeviceProfile(viewport, { dualPanels: leftPanelOpen && rightPanelOpen });

  const hidden: SlotName[] = [];
  const slots: Record<SlotName, SlotRect | null> = {
    topBar: null,
    leftRail: null,
    rightRail: null,
    hudTop: null,
    hudBottom: null,
    centreStage: null,
    touchDock: null
  };

  const residual: Residual = {
    top: safeArea.top,
    left: safeArea.left,
    right: Math.max(safeArea.left, viewport.width - safeArea.right),
    bottom: Math.max(safeArea.top, viewport.height - safeArea.bottom)
  };

  if (topBarOpen) {
    const height = Math.min(TOP_BAR_HEIGHT_PX, heightOf(residual));
    slots.topBar = { top: residual.top, left: residual.left, width: widthOf(residual), height };
    residual.top += height;
  }

  // Rails only exist when panels dock. Sheets float over the workspace by
  // design, so reserving a rail for one would strand the stage off-screen.
  const railWidth = profile.reservesRail ? profile.edgeInsetPx + profile.panelWidthPx : 0;

  let grantedLeft = leftPanelOpen && railWidth > 0;
  let grantedRight = rightPanelOpen && railWidth > 0;

  const stageWidthWith = (left: boolean, right: boolean): number =>
    widthOf(residual) - (left ? railWidth : 0) - (right ? railWidth : 0);

  // Give rails back in reverse priority while the stage is starved. Right goes
  // first: the left panel is primary navigation.
  if (stageWidthWith(grantedLeft, grantedRight) < MIN_STAGE_WIDTH_PX && grantedRight) {
    grantedRight = false;
    hidden.push('rightRail');
  }
  if (stageWidthWith(grantedLeft, grantedRight) < MIN_STAGE_WIDTH_PX && grantedLeft) {
    grantedLeft = false;
    hidden.push('leftRail');
  }

  if (grantedLeft) {
    slots.leftRail = {
      top: residual.top,
      left: residual.left,
      width: railWidth,
      height: heightOf(residual)
    };
    residual.left += railWidth;
  }

  if (grantedRight) {
    slots.rightRail = {
      top: residual.top,
      left: residual.right - railWidth,
      width: railWidth,
      height: heightOf(residual)
    };
    residual.right -= railWidth;
  }

  // Vertical chrome claims from the stage that survived the rail pass.
  const stageIsSpatial = input.interactionMode !== 'chat';

  if (stageIsSpatial) {
    if (heightOf(residual) - HUD_TOP_HEIGHT_PX >= MIN_STAGE_HEIGHT_PX) {
      slots.hudTop = {
        top: residual.top,
        left: residual.left,
        width: widthOf(residual),
        height: HUD_TOP_HEIGHT_PX
      };
      residual.top += HUD_TOP_HEIGHT_PX;
    } else {
      hidden.push('hudTop');
    }
  }

  if (timelineOpen && stageIsSpatial) {
    if (heightOf(residual) - HUD_BOTTOM_HEIGHT_PX >= MIN_STAGE_HEIGHT_PX) {
      slots.hudBottom = {
        top: residual.bottom - HUD_BOTTOM_HEIGHT_PX,
        left: residual.left,
        width: widthOf(residual),
        height: HUD_BOTTOM_HEIGHT_PX
      };
      residual.bottom -= HUD_BOTTOM_HEIGHT_PX;
    } else {
      hidden.push('hudBottom');
    }
  }

  // The touch dock takes a corner square out of the stage rather than a full
  // band, so it is granted only when the stage can spare the width outright.
  const wantsTouchDock = (input.coarsePointer ?? profile.coarsePointer) && stageIsSpatial;
  if (wantsTouchDock) {
    const fits =
      widthOf(residual) - TOUCH_DOCK_SIZE_PX >= MIN_STAGE_WIDTH_PX &&
      heightOf(residual) >= TOUCH_DOCK_SIZE_PX;

    if (fits) {
      slots.touchDock = {
        top: residual.bottom - TOUCH_DOCK_SIZE_PX,
        left: residual.right - TOUCH_DOCK_SIZE_PX,
        width: TOUCH_DOCK_SIZE_PX,
        height: TOUCH_DOCK_SIZE_PX
      };
      residual.right -= TOUCH_DOCK_SIZE_PX;
    } else {
      hidden.push('touchDock');
    }
  }

  slots.centreStage = rectFrom(residual);

  return { slots, profile, hidden };
}
