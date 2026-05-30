import React, { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';

/**
 * Immersive game-style cursor (reticle + particle trail + hover-lock).
 * - Removes the original circle/dot elements and replaces them with a directional reticle.
 * - Adds a lightweight particle trail that spawns behind movement.
 * - Snaps / locks on to interactive elements (buttons, links, canvas) when hovered.
 */
export function CustomCursor() {
  const reticleRef = useRef<HTMLDivElement | null>(null);
  const ringRefs = useRef<HTMLDivElement[]>([]);
  const orbitRefs = useRef<HTMLDivElement[]>([]);
  const particleRefs = useRef<HTMLDivElement[]>([]);
  const lastTargetRef = useRef<HTMLElement | null>(null);
  const cursorDesign = useUIStore((s) => s.cursorDesign);
  const mouse = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });
  const pos = useRef({ x: mouse.current.x, y: mouse.current.y });
  const velocity = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const lockedPos = useRef<{ x: number; y: number } | null>(null);
  const isLockedRef = useRef(false);
  const debugRef = useRef<HTMLDivElement | null>(null);

  const motionReduced = useUIStore((s) => s.personalisation.motionReduced);

  // Particle pool configuration
  const MAX_PARTICLES = motionReduced ? 10 : 24;
  const particlesState = useRef(
    Array.from({ length: MAX_PARTICLES }).map(() => ({ x: pos.current.x, y: pos.current.y, vx: 0, vy: 0, life: 0 }))
  );
  const lastAllocIndex = useRef(0);
  const lastSpawnTs = useRef(0);
  const RING_COUNT = 3;
  const ORBIT_COUNT = 6;

  useEffect(() => {
    // Hide native cursor
    document.body.style.cursor = 'none';
    document.documentElement.style.cursor = 'none';

    // Show cursor on text inputs
    const showCursorOnInputs = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target?.matches('input[type="text"], textarea, input:not([type])')) {
        document.body.style.cursor = 'text';
      }
    };

    const hideCursorOnBlur = () => {
      const active = document.activeElement as HTMLElement;
      if (!active?.matches('input[type="text"], textarea, input:not([type])')) {
        document.body.style.cursor = 'none';
      }
    };

    document.addEventListener('focusin', showCursorOnInputs);
    document.addEventListener('focusout', hideCursorOnBlur);

    const getStoreHovered = () => useStore.getState().hoveredScreenPosition;

    const isInteractiveEl = (el: HTMLElement | null) => {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      const cs = window.getComputedStyle(el);
      // Treat canvas as interactive only if it looks like a pointer target (avoid locking to full canvas)
      const isCanvasPointer = el.tagName.toLowerCase() === 'canvas' && cs.cursor === 'pointer';
      return (
        tag === 'button' || tag === 'a' || tag === 'input' || el.closest('button') !== null || el.closest('a') !== null || cs.cursor === 'pointer' || isCanvasPointer
      );
    };

    // Use pointer events for broader device support and responsiveness
    const onPointerMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      const target = e.target as HTMLElement | null;
      lastTargetRef.current = target;

      // Priority: if Cesium hover system reports a hovered entity, lock to its screen pos
      const storeHovered = getStoreHovered();
      if (storeHovered) {
        lockedPos.current = { x: storeHovered.x, y: storeHovered.y };
        isLockedRef.current = true;
      } else if (isInteractiveEl(target)) {
        const r = target.getBoundingClientRect();
        lockedPos.current = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
        isLockedRef.current = true;
      } else {
        lockedPos.current = null;
        isLockedRef.current = false;
      }
    };

    const onPointerDown = () => { isMouseDownRef.current = true; };
    const onPointerUp = () => { isMouseDownRef.current = false; };

    window.addEventListener('pointermove', onPointerMove, { passive: true } as AddEventListenerOptions);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    let raf = 0;
    let lastTs = performance.now();

    const spawnParticle = (x: number, y: number, opts?: { elongated?: boolean, speed?: number }) => {
      const now = performance.now();
      // throttle spawns to avoid overwhelming DOM on very high-movement
      if (now - lastSpawnTs.current < (motionReduced ? 28 : 14)) return;
      lastSpawnTs.current = now;

      const pool = particlesState.current;
      let start = lastAllocIndex.current % pool.length;
      for (let i = 0; i < pool.length; i++) {
        const idx = (start + i) % pool.length;
        if (pool[idx].life <= 0) {
          pool[idx].x = x;
          pool[idx].y = y;
          const baseSpeed = opts?.speed ?? 1.6;
          pool[idx].vx = (Math.random() - 0.5) * baseSpeed;
          pool[idx].vy = (Math.random() - 0.5) * baseSpeed * (opts?.elongated ? 0.35 : 1);
          pool[idx].life = 12 + Math.random() * 28;
          lastAllocIndex.current = idx + 1;
          return;
        }
      }
    };

    const loop = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 16.6667, 4);
      lastTs = ts;

      // update velocity & position with lower damping for snappier response
      const targetX = lockedPos.current ? lockedPos.current.x : mouse.current.x;
      const targetY = lockedPos.current ? lockedPos.current.y : mouse.current.y;
      const dx = targetX - pos.current.x;
      const dy = targetY - pos.current.y;

      velocity.current.x = velocity.current.x * 0.6 + dx * 0.28;
      velocity.current.y = velocity.current.y * 0.6 + dy * 0.28;

      pos.current.x += velocity.current.x * dt;
      pos.current.y += velocity.current.y * dt;

      // Update reticle transform (only transform/opacity/boxShadow)
      if (reticleRef.current) {
        const angle = Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI);
        const speed = Math.min(1.6, Math.hypot(velocity.current.x, velocity.current.y) / 10);
        const scale = isMouseDownRef.current ? 0.9 : 1 + speed * 0.14;
        reticleRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${scale})`;
        reticleRef.current.style.opacity = isLockedRef.current ? '1' : '0.95';
        reticleRef.current.style.boxShadow = isLockedRef.current
          ? '0 0 26px rgba(138,91,199,0.36), inset 0 0 6px rgba(255,255,255,0.02)'
          : '0 0 14px rgba(56,189,248,0.12)';
      }

      // spawning logic (design-specific)
      switch (cursorDesign) {
        case 'dot-trail':
          if (Math.hypot(dx, dy) > 4) spawnParticle(pos.current.x - velocity.current.x * 0.6, pos.current.y - velocity.current.y * 0.6, { speed: 1.2 });
          break;
        case 'comet-tail':
          if (Math.hypot(dx, dy) > 3) spawnParticle(pos.current.x - velocity.current.x * 1.2, pos.current.y - velocity.current.y * 1.2, { elongated: true, speed: 2.8 });
          break;
        case 'vortex':
          if (Math.hypot(dx, dy) > 1) {
            for (let s = 0; s < 2; s++) spawnParticle(pos.current.x, pos.current.y, { speed: 1.6 });
          }
          break;
        default:
          if (Math.hypot(dx, dy) > 6) spawnParticle(pos.current.x - velocity.current.x * 0.8, pos.current.y - velocity.current.y * 0.8);
      }

      // update particle pool positions and DOM (minimize style mutations)
      for (let i = 0; i < particlesState.current.length; i++) {
        const p = particlesState.current[i];
        if (p.life > 0) {
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.x += p.vx * dt * 1.2;
          p.y += p.vy * dt * 1.2;
          p.life -= dt;
          const el = particleRefs.current[i];
          if (el) {
            const alpha = Math.max(0, Math.min(1, p.life / 36));
            if (cursorDesign === 'comet-tail') {
              el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scaleX(${1 + alpha * 2.6}) scaleY(${1 - alpha * 0.28})`;
            } else {
              el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${1 + alpha * 0.9})`;
            }
            el.style.opacity = `${alpha}`;
            el.style.boxShadow = `0 0 ${8 + alpha * 12}px rgba(166,123,234,${0.22 * alpha})`;
          }
        }
      }

      // orbit design
      if (cursorDesign === 'orbit' && orbitRefs.current.length > 0) {
        const t = ts / 1000;
        for (let i = 0; i < orbitRefs.current.length; i++) {
          const el = orbitRefs.current[i];
          if (!el) continue;
          const angle = t * (0.8 + i * 0.08) + (i / orbitRefs.current.length) * Math.PI * 2;
          const radius = 10 + i * 4;
          const ox = pos.current.x + Math.cos(angle) * radius;
          const oy = pos.current.y + Math.sin(angle) * radius;
          el.style.transform = `translate3d(${ox}px, ${oy}px, 0) translate(-50%, -50%)`;
          el.style.opacity = `${0.8 - i * 0.08}`;
        }
      }

      // ring pulse
      if (ringRefs.current.length > 0) {
        const t2 = ts / 1000;
        for (let i = 0; i < ringRefs.current.length; i++) {
          const rEl = ringRefs.current[i];
          if (!rEl) continue;
          const base = 0.8 + Math.sin(t2 * 1.2 + i) * 0.06;
          rEl.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%) scale(${1 + i * 0.18 * base})`;
          rEl.style.opacity = `${0.28 - i * 0.06}`;
        }
      }

      // debug overlay update
      if (debugRef.current) {
        const lp = lockedPos.current;
        debugRef.current.textContent = `mouse: ${Math.round(mouse.current.x)},${Math.round(mouse.current.y)}\npos: ${Math.round(pos.current.x)},${Math.round(pos.current.y)}\nvel: ${Math.round(velocity.current.x)},${Math.round(velocity.current.y)}\nlocked: ${lp ? `${Math.round(lp.x)},${Math.round(lp.y)}` : 'null'}`;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.body.style.cursor = '';
      document.documentElement.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('pointerdown', onPointerDown as any);
      window.removeEventListener('pointerup', onPointerUp as any);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('focusin', showCursorOnInputs);
      document.removeEventListener('focusout', hideCursorOnBlur);
      cancelAnimationFrame(raf);
    };
  }, [motionReduced, cursorDesign]);

  // Click pulse effect
  useEffect(() => {
    const onDown = () => {
      if (!reticleRef.current) return;
      reticleRef.current.animate([
        { transform: reticleRef.current.style.transform, filter: 'brightness(1.0)' },
        { transform: reticleRef.current.style.transform + ' scale(0.86)', filter: 'brightness(1.35)' },
      ], { duration: 120, easing: 'cubic-bezier(.2,.9,.2,1)' });
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <>
      {/* Reticle */}
      <div
        ref={reticleRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`,
          transition: 'box-shadow 160ms linear, opacity 180ms linear',
          willChange: 'transform, box-shadow, opacity',
        }}
      >
        {cursorDesign === 'crosshair' ? (
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 4 L18 32 M4 18 L32 18" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="18" cy="18" r="2.6" fill="#A67BEA" />
          </svg>
        ) : cursorDesign === 'pixel' ? (
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="11" width="8" height="8" fill="#FFF" />
            <rect x="15.5" y="12.5" width="5" height="5" fill="#8A5BC7" />
          </svg>
        ) : cursorDesign === 'arrow' ? (
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 6 L28 18 L20 20 L16 28 L10 6" fill="#FFF" />
          </svg>
        ) : cursorDesign === 'radar' ? (
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="9" stroke="#74F5C4" strokeWidth="1.2" fill="none" />
            <path d="M18 18 L30 12" stroke="#74F5C4" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ) : (
          // Default reticle
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="10" stroke="rgba(166,123,234,0.9)" strokeWidth="1" fill="rgba(10,10,12,0.0)" />
            <path d="M18 6 L18 10 M18 26 L18 30 M6 18 L10 18 M26 18 L30 18" stroke="rgba(255,255,255,0.92)" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="18" cy="18" r="2.2" fill="rgba(255,255,255,0.95)" />
          </svg>
        )}
      </div>

      {/* Particle trail elements */}
      {Array.from({ length: MAX_PARTICLES }).map((_, i) => (
        <div
          key={`pc-${i}`}
          ref={(el) => {
            if (!el) return;
            particleRefs.current[i] = el;
          }}
          className="pointer-events-none fixed z-[9996] rounded-full"
          style={{
            width: 6,
            height: 6,
            transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(166,123,234,0.28))',
            opacity: 0,
            willChange: 'transform, opacity, width, height',
          }}
        />
      ))}

      {/* Orbit dots (for orbit design) */}
      {Array.from({ length: ORBIT_COUNT }).map((_, i) => (
        <div
          key={`orbit-${i}`}
          ref={(el) => {
            if (!el) return;
            orbitRefs.current[i] = el;
          }}
          className="pointer-events-none fixed z-[9995] rounded-full"
          style={{
            width: 6,
            height: 6,
            background: '#FFD27A',
            transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`,
            opacity: 0,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* Ring pulse elements */}
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <div
          key={`ring-${i}`}
          ref={(el) => {
            if (!el) return;
            ringRefs.current[i] = el;
          }}
          className="pointer-events-none fixed z-[9994] rounded-full border"
          style={{
            width: 36 + i * 10,
            height: 36 + i * 10,
            borderWidth: 1,
            borderColor: 'rgba(125,227,201,0.22)',
            transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`,
            opacity: 0,
            boxShadow: '0 0 18px rgba(125,227,201,0.06)',
            willChange: 'transform, opacity',
          }}
        />
      ))}
    {typeof window !== 'undefined' && localStorage.getItem('wwv-debug-cursor') === '1' && (
      <div
        ref={debugRef}
        aria-hidden
        style={{
          position: 'fixed',
          left: 8,
          top: 8,
          zIndex: 10001,
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 11,
          padding: '6px 8px',
          borderRadius: 6,
          pointerEvents: 'none',
          whiteSpace: 'pre'
        }}
      />
    )}
    </>
  );
}
