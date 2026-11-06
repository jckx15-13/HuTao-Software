import { useEffect, useRef, useState } from 'react';

export type ViewportSize = {
  width: number;
  height: number;
};

const FALLBACK_VIEWPORT: ViewportSize = {
  width: 1280,
  height: 720
};

const resolveViewportSize = (): ViewportSize => {
  if (typeof window === 'undefined') {
    return FALLBACK_VIEWPORT;
  }

  const viewport = window.visualViewport;
  const rawWidth = viewport ? viewport.width : window.innerWidth;
  const rawHeight = viewport ? viewport.height : window.innerHeight;

  const width = Number.isFinite(rawWidth) ? Math.max(1, Math.round(rawWidth)) : FALLBACK_VIEWPORT.width;
  const height = Number.isFinite(rawHeight) ? Math.max(1, Math.round(rawHeight)) : FALLBACK_VIEWPORT.height;

  return { width, height };
};

export function useViewportSize(): ViewportSize {
  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => {
    if (typeof window === 'undefined') {
      return FALLBACK_VIEWPORT;
    }

    return resolveViewportSize();
  });
  const rafIdRef = useRef<number | null>(null);

  const updateViewport = () => {
    if (typeof window === 'undefined') return;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      setViewportSize(resolveViewportSize());
      rafIdRef.current = null;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const viewport = window.visualViewport;

    window.addEventListener('resize', updateViewport, { passive: true });
    viewport?.addEventListener('resize', updateViewport, { passive: true });
    viewport?.addEventListener('scroll', updateViewport, { passive: true });

    // Observe the document element as well as listening for `resize`.
    //
    // The listeners above only fire when the browser dispatches a window
    // `resize`, and a layout can change size without one — an embedded frame
    // resized by its host is the case that exposed this, where the viewport
    // genuinely reported the new width while every consumer of this hook kept
    // rendering the previous size's geometry (measured: an 820px viewport still
    // resolving 403px desktop rails, leaving a 14px centre stage).
    // ResizeObserver reports the box actually used for layout, so it catches
    // that class of change whether or not an event was dispatched.
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateViewport);
      observer.observe(document.documentElement);
    }

    updateViewport();

    return () => {
      window.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      observer?.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return viewportSize;
}
