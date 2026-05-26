import React, { useEffect, useRef, useState } from 'react';

/**
 * A modern, fluid custom cursor that provides a trailing glow effect.
 * It smoothly interpolates to the mouse position using a linear interpolation (lerp) loop.
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Use refs for physical positions to avoid React re-renders on every mouse move
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const follower = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    // Hide default cursor across the body when this component mounts
    document.body.style.cursor = 'none';

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      // Instantly move the core dot
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check if hovering over interactive elements
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'input' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        window.getComputedStyle(target).cursor === 'pointer';
        
      setIsHovering(isInteractive);
    };

    window.addEventListener('mousemove', onMouseMove);

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
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      {/* The main sharp dot cursor */}
      <div
        ref={cursorRef}
        className={`pointer-events-none fixed top-0 left-0 z-[9999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-opacity duration-300 ${
          isHovering ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ willChange: 'transform' }}
      />
      
      {/* The smooth trailing glowing follower */}
      <div
        ref={followerRef}
        className={`pointer-events-none fixed top-0 left-0 z-[9998] rounded-full border-2 border-primary/50 transition-all duration-300 ease-out flex items-center justify-center ${
          isHovering 
            ? 'h-12 w-12 bg-primary/20 backdrop-blur-[2px]' 
            : 'h-8 w-8 bg-transparent'
        }`}
        style={{
          willChange: 'transform, width, height',
          boxShadow: isHovering ? '0 0 20px var(--primary-glow)' : '0 0 10px var(--primary-glow)'
        }}
      />
    </>
  );
}
