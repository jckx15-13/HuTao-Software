import { describe, expect, it } from 'vitest';
import {
  MIN_STAGE_WIDTH_PX,
  assertNoIntersection,
  rectsIntersect,
  resolveLayout,
  type InteractionMode,
  type LayoutInput
} from '../layoutEngine';

/** One viewport per DeviceClass boundary the breakpoint table distinguishes. */
const VIEWPORTS = [
  { name: 'watch 320x320', width: 320, height: 320 },
  { name: 'phone 390x844', width: 390, height: 844 },
  { name: 'phablet 540x960', width: 540, height: 960 },
  { name: 'tablet 820x1180', width: 820, height: 1180 },
  { name: 'laptop 1024x768', width: 1024, height: 768 },
  { name: 'laptop 1366x768', width: 1366, height: 768 },
  { name: 'desktop 1440x900', width: 1440, height: 900 },
  { name: 'desktop 1920x1080', width: 1920, height: 1080 },
  { name: 'ultrawide 3440x1440', width: 3440, height: 1440 },
  { name: 'short landscape 900x420', width: 900, height: 420 }
] as const;

const MODES: readonly InteractionMode[] = ['chat', 'orbital', 'telescope'];
const BOOLEANS = [true, false] as const;

function inputsFor(viewport: { width: number; height: number }): LayoutInput[] {
  const combos: LayoutInput[] = [];
  for (const mode of MODES) {
    for (const leftPanelOpen of BOOLEANS) {
      for (const rightPanelOpen of BOOLEANS) {
        for (const topBarOpen of BOOLEANS) {
          for (const timelineOpen of BOOLEANS) {
            for (const coarsePointer of BOOLEANS) {
              combos.push({
                viewport,
                leftPanelOpen,
                rightPanelOpen,
                topBarOpen,
                timelineOpen,
                interactionMode: mode,
                coarsePointer
              });
            }
          }
        }
      }
    }
  }
  return combos;
}

describe('rectsIntersect', () => {
  it('detects a genuine overlap', () => {
    const a = { top: 0, left: 0, width: 100, height: 100 };
    const b = { top: 50, left: 50, width: 100, height: 100 };

    expect(rectsIntersect(a, b)).toBe(true);
  });

  it('treats exactly abutting edges as separate', () => {
    const a = { top: 0, left: 0, width: 100, height: 100 };
    const b = { top: 0, left: 100, width: 100, height: 100 };

    expect(rectsIntersect(a, b)).toBe(false);
  });

  it('ignores zero-area rects', () => {
    const a = { top: 0, left: 0, width: 0, height: 100 };
    const b = { top: 0, left: 0, width: 100, height: 100 };

    expect(rectsIntersect(a, b)).toBe(false);
  });
});

describe('resolveLayout invariants', () => {
  it('never produces intersecting slots, across every viewport and state', () => {
    for (const viewport of VIEWPORTS) {
      for (const input of inputsFor(viewport)) {
        const { slots } = resolveLayout(input);

        expect(() => assertNoIntersection(slots)).not.toThrow();
      }
    }
  });

  it('keeps every slot inside the viewport', () => {
    for (const viewport of VIEWPORTS) {
      for (const input of inputsFor(viewport)) {
        const { slots } = resolveLayout(input);

        for (const rect of Object.values(slots)) {
          if (!rect) continue;
          expect(rect.left).toBeGreaterThanOrEqual(0);
          expect(rect.top).toBeGreaterThanOrEqual(0);
          expect(rect.left + rect.width).toBeLessThanOrEqual(viewport.width);
          expect(rect.top + rect.height).toBeLessThanOrEqual(viewport.height);
        }
      }
    }
  });

  it('never emits a negative dimension', () => {
    for (const viewport of VIEWPORTS) {
      for (const input of inputsFor(viewport)) {
        const { slots } = resolveLayout(input);

        for (const rect of Object.values(slots)) {
          if (!rect) continue;
          expect(rect.width).toBeGreaterThanOrEqual(0);
          expect(rect.height).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe('stage protection', () => {
  it('hides a rail rather than starving the stage below the minimum', () => {
    // 820x1180 with both panels docked is the measured case that produced a
    // 220px stage before the engine existed.
    const { slots, hidden } = resolveLayout({
      viewport: { width: 820, height: 1180 },
      leftPanelOpen: true,
      rightPanelOpen: true,
      topBarOpen: true,
      timelineOpen: false,
      interactionMode: 'orbital'
    });

    expect(hidden).toContain('rightRail');
    expect(slots.rightRail).toBeNull();
    expect(slots.centreStage?.width ?? 0).toBeGreaterThanOrEqual(MIN_STAGE_WIDTH_PX);
  });

  it('grants both rails when the stage can afford them', () => {
    const { slots, hidden } = resolveLayout({
      viewport: { width: 1920, height: 1080 },
      leftPanelOpen: true,
      rightPanelOpen: true,
      topBarOpen: true,
      timelineOpen: false,
      interactionMode: 'orbital'
    });

    expect(hidden).not.toContain('leftRail');
    expect(hidden).not.toContain('rightRail');
    expect(slots.leftRail).not.toBeNull();
    expect(slots.rightRail).not.toBeNull();
    expect(slots.centreStage?.width ?? 0).toBeGreaterThanOrEqual(MIN_STAGE_WIDTH_PX);
  });

  it('reserves no rail where panels present as sheets', () => {
    const { slots } = resolveLayout({
      viewport: { width: 390, height: 844 },
      leftPanelOpen: true,
      rightPanelOpen: true,
      topBarOpen: true,
      timelineOpen: false,
      interactionMode: 'orbital'
    });

    expect(slots.leftRail).toBeNull();
    expect(slots.rightRail).toBeNull();
    expect(slots.centreStage?.width).toBe(390);
  });

  it('leaves the stage spanning the full width when no chrome is open', () => {
    const { slots } = resolveLayout({
      viewport: { width: 1440, height: 900 },
      leftPanelOpen: false,
      rightPanelOpen: false,
      topBarOpen: false,
      timelineOpen: false,
      interactionMode: 'chat'
    });

    expect(slots.centreStage).toEqual({ top: 0, left: 0, width: 1440, height: 900 });
  });

  it('subtracts safe-area insets before anything else', () => {
    const { slots } = resolveLayout({
      viewport: { width: 390, height: 844 },
      safeArea: { top: 47, right: 0, bottom: 34, left: 0 },
      leftPanelOpen: false,
      rightPanelOpen: false,
      topBarOpen: false,
      timelineOpen: false,
      interactionMode: 'chat'
    });

    expect(slots.centreStage).toEqual({ top: 47, left: 0, width: 390, height: 763 });
  });
});
