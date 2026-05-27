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
  const velocity = useRef({ x: 0, y: 0 });
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastTargetRef = useRef<HTMLElement | null>(null);
  const isMouseDownRef = useRef(false);

  useEffect(() => {
    // Hide default cursor across the document when this component mounts
    document.body.style.cursor = 'none';
    document.documentElement.style.cursor = 'none';

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

    // Animation loop for the trailing follower with game-style spring physics.
    let animationFrame: number;
    const renderLoop = (timestamp: number) => {
      const lastTime = lastFrameTimeRef.current ?? timestamp;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.03);
      lastFrameTimeRef.current = timestamp;

      const dx = mouse.current.x - follower.current.x;
      const dy = mouse.current.y - follower.current.y;
      const stiffness = 0.25;
      const damping = 0.82;

      velocity.current.x += dx * stiffness;
      velocity.current.y += dy * stiffness;
      velocity.current.x *= damping;
      velocity.current.y *= damping;

      follower.current.x += velocity.current.x * dt * 60;
      follower.current.y += velocity.current.y * dt * 60;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${follower.current.x}px, ${follower.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrame = requestAnimationFrame(renderLoop);
    };
    animationFrame = requestAnimationFrame(renderLoop);

    // Restore default cursor on unmount
    return () => {
      document.body.style.cursor = '';
      document.documentElement.style.cursor = '';
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
        className={`pointer-events-none fixed top-0 left-0 z-[9999] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ease-out ${
          cursorType === 'pointer' ? 'bg-primary/90 scale-95 shadow-[0_0_18px_rgba(56,189,248,0.55)]' :
          cursorType === 'grabbing' ? 'bg-primary/100 scale-110 shadow-[0_0_20px_rgba(56,189,248,0.8)]' :
          cursorType === 'grab' ? 'bg-primary/70 scale-95 shadow-[0_0_10px_rgba(56,189,248,0.25)]' :
          'bg-primary/60 scale-100 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
        }`}
        style={{ willChange: 'transform, width, height' }}
      />
      
      {/* The smooth trailing glowing follower */}
      <div
        ref={followerRef}
        className={`pointer-events-none fixed top-0 left-0 z-[9998] rounded-full border transition-all duration-250 ease-out ${
          cursorType === 'pointer' 
            ? 'h-14 w-14 border-primary/70 bg-primary/15 shadow-[0_0_24px_rgba(56,189,248,0.32)]' 
            : cursorType === 'grabbing'
            ? 'h-10 w-10 border-primary/80 bg-primary/25 shadow-[0_0_20px_rgba(56,189,248,0.45)]' 
            : cursorType === 'grab'
            ? 'h-12 w-12 border-dashed border-primary/50 bg-primary/10 shadow-[0_0_16px_rgba(56,189,248,0.18)]' 
            : 'h-10 w-10 border-primary/40 bg-black/10 shadow-[0_0_12px_rgba(56,189,248,0.12)]'
        }`}
        style={{
          willChange: 'transform, width, height',
        }}
      />
    </>
  );
}
