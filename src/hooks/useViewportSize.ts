import { useEffect, useRef, useState } from 'react';

export type ViewportSize = {
  width: number;
  height: number;
};

const FALLBACK_VIEWPORT: ViewportSize = {
  width: 1280,
  height: 720,
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
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      rafIdRef.current = null;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const viewport = window.visualViewport;

    window.addEventListener('resize', updateViewport, { passive: true });
    viewport?.addEventListener('resize', updateViewport, { passive: true });
    viewport?.addEventListener('scroll', updateViewport, { passive: true });
    updateViewport();

    return () => {
      window.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return viewportSize;
}
