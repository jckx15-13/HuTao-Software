import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore';
import type { ParticleWorkerMessage, ParticleWorkerResponse } from '../types/particleWorker';

const PARTICLE_COUNT = 50;
const PARTICLE_SPEED = 0.5;

interface MainThreadParticle {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  alpha: number;
}

function createParticle(width: number, height: number): MainThreadParticle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * PARTICLE_SPEED,
    dy: (Math.random() - 0.5) * PARTICLE_SPEED,
    alpha: Math.random() * 0.5 + 0.1,
  };
}

export function ParticleOverlay() {
  const particleEffects = useUIStore((s) => s.particleEffects);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!particleEffects || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId = 0;
    let workerTickId = 0;
    let worker: Worker | null = null;
    let usingWorker = false;
    let disposed = false;
    let mainParticles: MainThreadParticle[] = [];
    let lastTime = performance.now();
    let themePrimary = '#A3E4D7';
    let themeReadCountdown = 0;

    const syncCanvasSize = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // Read CSS variable sparsely to avoid synchronous style lookups on every frame.
      if (themeReadCountdown <= 0) {
        themePrimary =
          getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#A3E4D7';
        themeReadCountdown = 24;
      } else {
        themeReadCountdown -= 1;
      }
      ctx.fillStyle = themePrimary;

      const frame = frameRef.current;
      if (frame && frame.length > 0) {
        const count = frame.length / 4;
        for (let i = 0; i < count; i += 1) {
          const base = i * 4;
          ctx.globalAlpha = frame[base + 3];
          ctx.beginPath();
          ctx.arc(frame[base], frame[base + 1], frame[base + 2], 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = window.requestAnimationFrame(drawFrame);
    };

    const runMainThreadFallback = () => {
      mainParticles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(width, height));

      const updateFallback = (now: number) => {
        const delta = Math.min(2.5, Math.max(0.5, (now - lastTime) / 16.6667));
        lastTime = now;

        for (const particle of mainParticles) {
          particle.x += particle.dx * delta;
          particle.y += particle.dy * delta;
          if (particle.x < 0) particle.x = width;
          if (particle.x > width) particle.x = 0;
          if (particle.y < 0) particle.y = height;
          if (particle.y > height) particle.y = 0;
        }

        const packed = new Float32Array(mainParticles.length * 4);
        for (let i = 0; i < mainParticles.length; i += 1) {
          const base = i * 4;
          const p = mainParticles[i];
          packed[base] = p.x;
          packed[base + 1] = p.y;
          packed[base + 2] = p.r;
          packed[base + 3] = p.alpha;
        }
        frameRef.current = packed;

        if (!disposed) {
          window.requestAnimationFrame(updateFallback);
        }
      };

      window.requestAnimationFrame(updateFallback);
    };

    syncCanvasSize();
    drawFrame();

    const onResize = () => {
      syncCanvasSize();
      if (worker) {
        const message: ParticleWorkerMessage = { type: 'resize', width, height };
        worker.postMessage(message);
      }
    };
    window.addEventListener('resize', onResize);

    try {
      worker = new Worker(new URL('../workers/particleWorker.ts', import.meta.url), { type: 'module' });
      usingWorker = true;
      const init: ParticleWorkerMessage = {
        type: 'init',
        width,
        height,
        count: PARTICLE_COUNT,
        speed: PARTICLE_SPEED,
      };
      worker.postMessage(init);

      worker.onmessage = (event: MessageEvent<ParticleWorkerResponse>) => {
        if (event.data.type === 'frame') {
          frameRef.current = new Float32Array(event.data.data);
        }
      };

      let lastTick = performance.now();
      const tickWorker = () => {
        if (!worker || disposed) return;
        const now = performance.now();
        const tick: ParticleWorkerMessage = {
          type: 'tick',
          deltaMs: now - lastTick,
          isVisible: document.visibilityState === 'visible',
        };
        lastTick = now;
        worker.postMessage(tick);
      };

      workerTickId = window.setInterval(tickWorker, 16);
    } catch {
      usingWorker = false;
      runMainThreadFallback();
    }

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(rafId);
      if (workerTickId) window.clearInterval(workerTickId);
      if (worker && usingWorker) {
        const stop: ParticleWorkerMessage = { type: 'stop' };
        worker.postMessage(stop);
        worker.terminate();
      }
    };
  }, [particleEffects]);

  if (!particleEffects) return null;

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-50" />;
}
