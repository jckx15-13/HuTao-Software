import { useEffect, useMemo, useRef } from 'react';
import { motion, useDragControls, useMotionValue } from 'motion/react';
import { Settings2, X, Maximize2, Minimize2 } from 'lucide-react';
import { SettingsPane } from './SettingsPane';
import { useUIStore } from '../store/uiStore';

export interface WobblePhysicsConfig {
  stiffness: number;
  damping: number;
  mass: number;
  deformClamp: number;
  releaseDecay: number;
}

const WOBBLE_CONFIG: WobblePhysicsConfig = {
  stiffness: 140,
  damping: 28,
  mass: 0.8,
  deformClamp: 14,
  releaseDecay: 0.9,
};

interface WobbleState {
  skewX: number;
  skewY: number;
  rotateX: number;
  rotateY: number;
  scale: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function SettingsWindow({ onClose }: { onClose: () => void }) {
  const isDocked = useUIStore((s) => s.settingsDocked);
  const setIsDocked = useUIStore((s) => s.setSettingsDocked);
  const controls = useDragControls();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const skewX = useMotionValue(0);
  const skewY = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);

  const physicsRef = useRef<WobbleState>({
    skewX: 0,
    skewY: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
  });
  const pointerRef = useRef({ x: 0, y: 0, t: 0 });
  const lastFrameRef = useRef(performance.now());
  const draggingRef = useRef(false);
  const rafRef = useRef(0);

  const windowMetrics = useMemo(() => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const floatingWidth = Math.min(500, windowWidth - 32);
    const floatingHeight = Math.min(600, windowHeight - 80);
    const dockedWidth = Math.min(400, windowWidth);
    const initialLeft = Math.max(16, windowWidth / 2 - floatingWidth / 2);
    const initialTop = Math.max(56, windowHeight / 2 - floatingHeight / 2);
    return { floatingWidth, floatingHeight, dockedWidth, initialLeft, initialTop };
  }, []);

  useEffect(() => {
    if (isDocked) {
      skewX.set(0);
      skewY.set(0);
      rotateX.set(0);
      rotateY.set(0);
      scale.set(1);
      physicsRef.current = {
        skewX: 0,
        skewY: 0,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
      };
      return;
    }

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.008, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;

      const state = physicsRef.current;
      const c = WOBBLE_CONFIG;

      const tx = clamp((-state.vx / 2200) * c.deformClamp, -c.deformClamp, c.deformClamp);
      const ty = clamp((state.vy / 2600) * c.deformClamp * 0.5, -c.deformClamp * 0.5, c.deformClamp * 0.5);
      const trY = clamp((-state.vx / 1800) * c.deformClamp, -c.deformClamp, c.deformClamp);
      const trX = clamp((state.vy / 1800) * c.deformClamp, -c.deformClamp, c.deformClamp);
      const ts = clamp(1 - Math.min((Math.abs(state.vx) + Math.abs(state.vy)) / 14000, 0.05), 0.95, 1.02);

      state.ax = ((tx - state.skewX) * c.stiffness - c.damping * state.ax) / c.mass;
      state.ay = ((ty - state.skewY) * c.stiffness - c.damping * state.ay) / c.mass;
      state.skewX += state.ax * dt;
      state.skewY += state.ay * dt;
      state.rotateY += ((trY - state.rotateY) * c.stiffness * 0.55 - c.damping * state.rotateY) * dt;
      state.rotateX += ((trX - state.rotateX) * c.stiffness * 0.55 - c.damping * state.rotateX) * dt;
      state.scale += (ts - state.scale) * dt * 8;

      if (!draggingRef.current) {
        state.vx *= c.releaseDecay;
        state.vy *= c.releaseDecay;
      }

      skewX.set(state.skewX);
      skewY.set(state.skewY);
      rotateX.set(state.rotateX);
      rotateY.set(state.rotateY);
      scale.set(state.scale);

      rafRef.current = window.requestAnimationFrame(tick);
    };

    lastFrameRef.current = performance.now();
    rafRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafRef.current);
  }, [isDocked, rotateX, rotateY, scale, skewX, skewY]);

  return (
    <motion.div
      drag={!isDocked}
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={() => {
        draggingRef.current = true;
      }}
      onDragEnd={() => {
        draggingRef.current = false;
      }}
      onPointerMove={(event) => {
        if (isDocked || !draggingRef.current) return;
        const now = performance.now();
        const dt = Math.max(1, now - pointerRef.current.t);
        const vx = ((event.clientX - pointerRef.current.x) / dt) * 1000;
        const vy = ((event.clientY - pointerRef.current.y) / dt) * 1000;
        pointerRef.current = { x: event.clientX, y: event.clientY, t: now };
        physicsRef.current.vx = vx;
        physicsRef.current.vy = vy;
      }}
      style={{
        x,
        y,
        skewX,
        skewY,
        rotateX,
        rotateY,
        scale,
        transformOrigin: 'top center',
        transformPerspective: 1200,
        minWidth: 320,
        minHeight: 360,
      }}
      initial={{
        opacity: 0,
        scale: 0.9,
        x: isDocked ? 0 : windowMetrics.initialLeft,
        y: isDocked ? 0 : windowMetrics.initialTop + 20,
      }}
      animate={
        isDocked
          ? {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              right: 0,
              top: 48,
              bottom: 0,
              width: windowMetrics.dockedWidth,
              height: 'auto',
              position: 'fixed' as const,
              borderRadius: '8px 0 0 8px',
            }
          : {
              opacity: 1,
              scale: 1,
              x: windowMetrics.initialLeft,
              y: windowMetrics.initialTop,
              width: windowMetrics.floatingWidth,
              height: windowMetrics.floatingHeight,
              position: 'absolute' as const,
              borderRadius: '8px',
            }
      }
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 1 }}
      className="absolute z-50 flex flex-col overflow-hidden border border-primary/30 bg-panel/30 shadow-[0_20px_50px_color-mix(in_srgb,var(--theme-primary)_18%,transparent)] panel-glass backdrop-blur-md saturate-150 backdrop-brightness-110"
    >
      <div
        className={`h-14 bg-gradient-to-r from-panel-border/30 to-panel/10 border-b border-panel-border/50 flex items-center justify-between px-5 shrink-0 ${!isDocked ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onDoubleClick={() => setIsDocked(!isDocked)}
        onPointerDown={(e) => {
          pointerRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
          if (!isDocked) controls.start(e);
        }}
      >
        <div className="font-mono text-primary text-xs uppercase tracking-widest font-bold flex items-center gap-3 drop-shadow-[0_0_8px_var(--theme-primary)]">
          <Settings2 className="w-4 h-4" />
          Settings Core
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsDocked(!isDocked)}
            className="text-text-muted hover:text-primary transition-all duration-300 p-2 rounded-lg hover:bg-primary/20 hover:shadow-[0_0_10px_var(--theme-primary)]"
            title={isDocked ? 'Undock' : 'Dock to side'}
          >
            {isDocked ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-danger transition-all duration-300 p-2 rounded-lg hover:bg-danger/20 hover:shadow-[0_0_10px_var(--theme-danger)]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative p-2">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-base/10 pointer-events-none" />
        <SettingsPane />
      </div>
    </motion.div>
  );
}
