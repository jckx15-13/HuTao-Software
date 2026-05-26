import React, { useEffect, useRef, useState } from 'react';

/**
 * A modern, fluid custom cursor that provides a trailing glow effect.
 * It smoothly interpolates to the mouse position using a linear interpolation (lerp) loop.
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const [cursorType, setCursorType] = useState<'default' | 'pointer' | 'grab' | 'grabbing'>('default');

  // Use refs for physical positions to avoid React re-renders on every mouse move
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const follower = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const lastTargetRef = useRef<HTMLElement | null>(null);
  const isMouseDownRef = useRef(false);

  useEffect(() => {
    // Hide default cursor across the body when this component mounts
    document.body.style.cursor = 'none';

    const updateCursorType = (target: HTMLElement | null) => {
      const el = target || lastTargetRef.current;
      if (!el) return;

      const computedStyle = window.getComputedStyle(el);
      const computedCursor = computedStyle.cursor;

      const isInteractive = 
        el.tagName.toLowerCase() === 'button' ||
        el.tagName.toLowerCase() === 'a' ||
        el.tagName.toLowerCase() === 'input' ||
        el.closest('button') !== null ||
        el.closest('a') !== null ||
        computedCursor === 'pointer';

      if (isMouseDownRef.current && (computedCursor === 'grab' || computedCursor === 'grabbing' || el.closest('.earth-stage') || el.closest('.cesium-viewer') || el.tagName.toLowerCase() === 'canvas')) {
        setCursorType('grabbing');
      } else if (isInteractive) {
        setCursorType('pointer');
      } else if (computedCursor === 'grab' || computedCursor === 'grabbing' || el.closest('.earth-stage') || el.closest('.cesium-viewer') || el.tagName.toLowerCase() === 'canvas') {
        setCursorType('grab');
      } else {
        setCursorType('default');
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      // Instantly move the core dot
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      const target = e.target as HTMLElement;
      lastTargetRef.current = target;
      updateCursorType(target);
    };

    const onMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      updateCursorType(e.target as HTMLElement);
    };

    const onMouseUp = (e: MouseEvent) => {
      isMouseDownRef.current = false;
      updateCursorType(e.target as HTMLElement);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Animation loop for the trailing follower
    let animationFrame: number;
    const renderLoop = () => {
      // Lerp logic for smooth trailing
      follower.current.x += (mouse.current.x - follower.current.x) * 0.15;
      follower.current.y += (mouse.current.y - follower.current.y) * 0.15;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${follower.current.x}px, ${follower.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrame = requestAnimationFrame(renderLoop);
    };
    animationFrame = requestAnimationFrame(renderLoop);

    // Restore default cursor on unmount
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      {/* The main sharp dot cursor */}
      <div
        ref={cursorRef}
        className={`pointer-events-none fixed top-0 left-0 z-[9999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-[scale,opacity,background-color] duration-200 ${
          cursorType === 'pointer' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
        } ${cursorType === 'grabbing' ? 'bg-primary-hover h-2.5 w-2.5' : ''}`}
        style={{ willChange: 'transform' }}
      />
      
      {/* The smooth trailing glowing follower */}
      <div
        ref={followerRef}
        className={`pointer-events-none fixed top-0 left-0 z-[9998] rounded-full border-2 border-primary/50 transition-[width,height,background-color,border-color,box-shadow,opacity] duration-300 ease-out flex items-center justify-center ${
          cursorType === 'pointer' 
            ? 'h-12 w-12 bg-primary/20 backdrop-blur-[2px]' 
            : cursorType === 'grabbing'
            ? 'h-6 w-6 bg-primary/30 border-solid border-primary'
            : cursorType === 'grab'
            ? 'h-9 w-9 bg-primary/5 border-dashed border-primary/60'
            : 'h-8 w-8 bg-transparent'
        }`}
        style={{
          willChange: 'transform, width, height',
          boxShadow: cursorType === 'pointer' || cursorType === 'grabbing' 
            ? '0 0 20px var(--primary-glow)' 
            : '0 0 10px var(--primary-glow)'
        }}
      />
    </>
  );
}
