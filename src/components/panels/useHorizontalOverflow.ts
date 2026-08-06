import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Measured overflow state for a horizontally scrolling strip.
 *
 * Every value here comes from real layout reads (scrollWidth / clientWidth /
 * scrollLeft) — never from a hardcoded breakpoint or an item count. The right
 * panel tab row overflows at some widths and not others depending on the panel
 * geometry, so the affordance has to follow the measurement.
 */
export type HorizontalOverflowState = {
  /** Content is wider than the visible box, so the strip scrolls at all. */
  hasOverflow: boolean;
  /** There is hidden content to the left of the current scroll position. */
  canScrollStart: boolean;
  /** There is hidden content to the right of the current scroll position. */
  canScrollEnd: boolean;
};

const IDLE_STATE: HorizontalOverflowState = {
  hasOverflow: false,
  canScrollStart: false,
  canScrollEnd: false
};

/** Sub-pixel layout rounding regularly leaves ~1px of phantom overflow. */
const EDGE_EPSILON_PX = 2;

const isSameState = (a: HorizontalOverflowState, b: HorizontalOverflowState): boolean =>
  a.hasOverflow === b.hasOverflow && a.canScrollStart === b.canScrollStart && a.canScrollEnd === b.canScrollEnd;

const readOverflowState = (element: HTMLElement): HorizontalOverflowState => {
  const maxScrollLeftPx = element.scrollWidth - element.clientWidth;
  if (!(maxScrollLeftPx > EDGE_EPSILON_PX)) return IDLE_STATE;

  // Math.abs keeps this correct if the strip is ever placed in an RTL context,
  // where scrollLeft runs negative in modern engines.
  const positionPx = Math.abs(element.scrollLeft);

  return {
    hasOverflow: true,
    canScrollStart: positionPx > EDGE_EPSILON_PX,
    canScrollEnd: positionPx < maxScrollLeftPx - EDGE_EPSILON_PX
  };
};

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Read at call time, never cached: a user can flip the OS setting mid-session and
// the very next scroll must honour it.
const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');

export type HorizontalOverflowController<T extends HTMLElement> = HorizontalOverflowState & {
  /** Callback ref for the element that owns `overflow-x: auto`. */
  attachScroller: (node: T | null) => void;
  /** Page the strip by most of a viewport width. -1 = towards the start. */
  scrollByPage: (direction: -1 | 1) => void;
  /** Bring a descendant fully inside the visible box if it is clipped. */
  revealChild: (child: HTMLElement | null | undefined, padPx?: number) => void;
};

/**
 * Tracks whether a horizontal scroller actually overflows, and on which side,
 * so callers can render a scroll affordance only when one is warranted.
 *
 * Why a CALLBACK ref rather than a `useRef` object: the scroller may mount long
 * after this hook first runs (the right panel renders `null` while collapsed).
 * A ref object would leave the setup effect's dependencies unchanged, so the
 * observers would never attach and the affordance would never appear after the
 * panel was reopened. Keeping the node in state re-runs setup exactly when the
 * element appears or disappears — and it keeps a ref out of the returned object,
 * which `react-hooks/refs` would otherwise treat as a ref read during render.
 *
 * Loop safety: observer and scroll callbacks are coalesced into a single
 * animation frame, and the state setter bails out when the measurement is
 * unchanged, so a re-measure that finds nothing new causes no re-render. Any
 * affordance the caller renders in response must sit OUTSIDE the observed
 * scroller: an in-flow control only ever shrinks the box, which cannot flip
 * `hasOverflow` back to false, so the two states are separated by a natural
 * hysteresis band instead of oscillating.
 */
export function useHorizontalOverflow<T extends HTMLElement>(): HorizontalOverflowController<T> {
  const [scroller, setScroller] = useState<T | null>(null);
  const [state, setState] = useState<HorizontalOverflowState>(IDLE_STATE);
  const frameRef = useRef<number | null>(null);

  const attachScroller = useCallback((node: T | null) => {
    setScroller(node);
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (!scroller) return;

    const runMeasure = () => {
      const next = readOverflowState(scroller);
      setState((previous) => (isSameState(previous, next) ? previous : next));
    };

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      runMeasure();
      return;
    }

    // Coalesce bursts (resize + scroll + font load) into one read per frame
    // rather than cancelling and re-queueing, which would starve the callback
    // during a continuous drag-resize.
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      runMeasure();
    });
  }, [scroller]);

  useEffect(() => {
    // No element (the panel is collapsed): nothing to observe. Stale state is
    // harmless because nothing renders, and remounting re-measures below.
    if (!scroller) return;

    scheduleMeasure();
    scroller.addEventListener('scroll', scheduleMeasure, { passive: true });

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      // The box itself catches panel/viewport resizes; the children catch content
      // growth (font swap, label change) that does not resize the container.
      resizeObserver.observe(scroller);
      for (const child of Array.from(scroller.children)) {
        resizeObserver.observe(child);
      }
    }

    return () => {
      scroller.removeEventListener('scroll', scheduleMeasure);
      resizeObserver?.disconnect();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [scheduleMeasure, scroller]);

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      if (!scroller) return;
      const stepPx = Math.max(80, Math.round(scroller.clientWidth * 0.75));
      scroller.scrollBy({ left: stepPx * direction, behavior: scrollBehavior() });
    },
    [scroller]
  );

  const revealChild = useCallback(
    (child: HTMLElement | null | undefined, padPx = 12) => {
      if (!scroller || !child) return;

      // Rect maths rather than offsetLeft: it stays correct no matter which
      // ancestor happens to be the offsetParent.
      const box = scroller.getBoundingClientRect();
      const item = child.getBoundingClientRect();

      let deltaPx = 0;
      if (item.left < box.left + padPx) {
        deltaPx = item.left - box.left - padPx;
      } else if (item.right > box.right - padPx) {
        deltaPx = item.right - box.right + padPx;
      }
      if (deltaPx === 0) return;

      scroller.scrollBy({ left: deltaPx, behavior: scrollBehavior() });
    },
    [scroller]
  );

  return { ...state, attachScroller, scrollByPage, revealChild };
}
