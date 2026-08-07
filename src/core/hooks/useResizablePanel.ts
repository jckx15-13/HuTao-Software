import { useState, useRef, useEffect, useCallback } from "react";

const clampWidth = (value: number, minWidth: number, maxWidth: number) => {
  return Math.max(minWidth, Math.min(maxWidth, Math.round(value)));
};

const clampWidthToViewport = (value: number, direction: 'left' | 'right') => {
  if (typeof window === 'undefined') {
    return value;
  }

  const reservedGutter = 40;
  const viewportWidth = Math.max(1, window.innerWidth - reservedGutter);
  const safeMaxWidth = Math.max(1, viewportWidth);
  return direction === 'left' || direction === 'right'
    ? Math.max(0, Math.min(value, safeMaxWidth))
    : value;
};

export function useResizablePanel(
  initialWidth: number,
  minWidth: number,
  maxWidth: number,
  direction: 'left' | 'right',
  enabled = true
) {
  const [width, setWidth] = useState(initialWidth);
  const currentWidthRef = useRef(initialWidth);
  const isResizing = useRef(false);

  const applyWidth = useCallback((nextWidth: number) => {
    const clampedByViewport = clampWidthToViewport(nextWidth, direction);
    const normalized = clampWidth(clampedByViewport, minWidth, maxWidth);
    currentWidthRef.current = normalized;
    setWidth(normalized);
    document.documentElement.style.setProperty(`--${direction}-sidebar-width`, `${normalized}px`);
  }, [direction, minWidth, maxWidth]);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.style.removeProperty(`--${direction}-sidebar-width`);
      return;
    }
    applyWidth(initialWidth);
  }, [applyWidth, direction, enabled, initialWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const proposedWidth = direction === 'left'
        ? e.clientX
        : window.innerWidth - e.clientX;
      applyWidth(proposedWidth);
    };

    const handleMouseUp = () => {
      if (!isResizing.current) return;

      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.classList.remove('is-resizing-sidebar');
    };

    const handleResize = () => {
      applyWidth(currentWidthRef.current);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [applyWidth, direction, minWidth, maxWidth]);

  const startResizing = (e: React.MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('is-resizing-sidebar');
  };

  return { width, startResizing };
}
