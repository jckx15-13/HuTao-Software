import { CursorTargetRegistry } from "./TargetRegistry";
import { deriveRuntimePolicy, resolveCursorProfile } from "./profiles";
import { validateCursorProfile } from "./diagnostics";
import { setActiveCursorEngine } from "./runtime";
import type {
  CursorEngineConfig,
  CursorEngineLifecycle,
  CursorFrameState,
  CursorIntent,
  CursorMode,
  CursorPointerModality,
  CursorRuntimePolicy,
  CursorTarget,
  CursorTargetSource,
  CursorVector,
} from "./types";

type TrailSample = {
  x: number;
  y: number;
  life: number;
  width: number;
};

const DEFAULT_CONFIG: CursorEngineConfig = {
  enabled: true,
  cursorDesign: "reticle-v1",
  reducedMotion: false,
  appHighLoad: false,
  animationIntensity: 0.7,
  particleEffects: true,
};

const MAX_DRIFT_PX = 110;
const DRAG_THRESHOLD_PX = 6;
const WATCHDOG_MS = 500;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isTextInputElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;
  const closest = element.closest("input, textarea, [contenteditable='true']");
  if (!(closest instanceof HTMLElement)) return false;
  if (closest instanceof HTMLInputElement) {
    const type = closest.type || "text";
    return !["button", "checkbox", "color", "file", "image", "radio", "range", "reset", "submit"].includes(type);
  }
  return true;
}

function getInteractiveTarget(element: Element | null): HTMLElement | null {
  if (!(element instanceof HTMLElement)) return null;
  return element.closest("button, a, input, textarea, select, [role='button'], [role='link'], [data-cursor-target]") as HTMLElement | null;
}

function cssColorWithAlpha(color: string, alpha: number): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(125, 227, 201, ${alpha})`;
}

export class CursorEngine implements CursorEngineLifecycle {
  private config: CursorEngineConfig;
  private mount: HTMLElement | null = null;
  private reticle: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private debug: HTMLDivElement | null = null;
  private raf = 0;
  private attached = false;
  private pointerActual: CursorVector = { x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: typeof window !== "undefined" ? window.innerHeight / 2 : 0 };
  private reticleVisual: CursorVector = { ...this.pointerActual };
  private velocity: CursorVector = { x: 0, y: 0 };
  private lastPointer: CursorVector = { ...this.pointerActual };
  private pressOrigin: CursorVector = { ...this.pointerActual };
  private recoil = 0;
  private recoilVelocity = 0;
  private lockStrength = 0;
  private measuredFrameMs = 16.7;
  private lastTs = performance.now();
  private lastMoveTs = performance.now();
  private modality: CursorPointerModality = "mouse";
  private pointerInsideViewport = true;
  private documentVisible = typeof document === "undefined" ? true : !document.hidden;
  private pressing = false;
  private dragging = false;
  private overTextInput = false;
  private readonly registry = new CursorTargetRegistry();
  private readonly trailPool: TrailSample[] = Array.from({ length: 96 }, () => ({ x: 0, y: 0, life: 0, width: 1 }));
  private trailIndex = 0;

  constructor(config: Partial<CursorEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  init(): void {
    setActiveCursorEngine(this);
  }

  attach(mount: HTMLElement): void {
    if (this.attached) this.detach();
    this.mount = mount;
    this.createDom();
    this.bindEvents();
    this.resizeCanvas();
    this.setDocumentCursor();
    this.attached = true;
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  detach(): void {
    cancelAnimationFrame(this.raf);
    this.unbindEvents();
    this.restoreDocumentCursor();
    this.registry.clear();
    this.mount?.replaceChildren();
    this.mount = null;
    this.reticle = null;
    this.canvas = null;
    this.ctx = null;
    this.debug = null;
    this.attached = false;
  }

  destroy(): void {
    this.detach();
    setActiveCursorEngine(null);
  }

  setEnabled(enabled: boolean): void {
    this.updateConfig({ enabled });
  }

  updateConfig(config: Partial<CursorEngineConfig>): void {
    const designChanged = config.cursorDesign !== undefined && config.cursorDesign !== this.config.cursorDesign;
    this.config = { ...this.config, ...config };
    this.setDocumentCursor();
    if (designChanged && this.reticle) {
      this.updateReticleSvg();
    }
  }

  publishTarget(target: Omit<Partial<CursorTarget>, "createdAt" | "hoverDwellMs"> & Pick<CursorTarget, "id" | "kind" | "source">): void {
    if (!this.config.enabled) return;
    this.registry.publish(target);
  }

  clearSourceTargets(source: CursorTargetSource): void {
    this.registry.clearSource(source);
  }

  private createDom(): void {
    if (!this.mount) return;
    this.mount.replaceChildren();
    Object.assign(this.mount.style, {
      position: "fixed",
      inset: "0",
      zIndex: "9999",
      pointerEvents: "none",
      overflow: "hidden",
      contain: "layout style paint",
    });

    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });
    this.ctx = this.canvas.getContext("2d", { alpha: true });

    this.reticle = document.createElement("div");
    this.reticle.setAttribute("aria-hidden", "true");
    Object.assign(this.reticle.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "42px",
      height: "42px",
      pointerEvents: "none",
      willChange: "transform, opacity, filter",
      transform: `translate3d(${this.reticleVisual.x - 21}px, ${this.reticleVisual.y - 21}px, 0)`,
      opacity: "0",
      transition: "opacity 90ms linear, filter 120ms linear",
    });
    this.updateReticleSvg();

    this.debug = document.createElement("div");
    Object.assign(this.debug.style, {
      position: "absolute",
      left: "8px",
      top: "8px",
      zIndex: "1",
      padding: "6px 8px",
      borderRadius: "6px",
      background: "rgba(0,0,0,.62)",
      color: "#fff",
      font: "11px/1.35 monospace",
      whiteSpace: "pre",
      pointerEvents: "none",
      display: this.config.debug || (typeof window !== "undefined" && window.localStorage && localStorage.getItem("wwv-debug-cursor") === "1") ? "block" : "none",
    });

    this.mount.append(this.canvas, this.reticle, this.debug);
  }

  private bindEvents(): void {
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("pointerup", this.onPointerUp, { passive: true });
    window.addEventListener("pointercancel", this.onPointerUp, { passive: true });
    window.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
    window.addEventListener("pointerenter", this.onPointerEnter, { passive: true });
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("focus", this.onWindowFocus);
    window.addEventListener("resize", this.resizeCanvas);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    document.addEventListener("focusin", this.onFocusChange);
    document.addEventListener("focusout", this.onFocusChange);
  }

  private unbindEvents(): void {
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("pointerenter", this.onPointerEnter);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("focus", this.onWindowFocus);
    window.removeEventListener("resize", this.resizeCanvas);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    document.removeEventListener("focusin", this.onFocusChange);
    document.removeEventListener("focusout", this.onFocusChange);
  }

  private onPointerMove = (event: PointerEvent): void => {
    const samples = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
    for (const sample of samples) {
      this.samplePointer(sample.clientX, sample.clientY, event.pointerType);
    }
    this.overTextInput = isTextInputElement(event.target as Element | null);
    this.publishUiTarget(event.target as Element | null);
    this.setDocumentCursor();
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.samplePointer(event.clientX, event.clientY, event.pointerType);
    this.pressing = true;
    this.dragging = false;
    this.pressOrigin = { ...this.pointerActual };
    this.recoilVelocity += 1.2;
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.samplePointer(event.clientX, event.clientY, event.pointerType);
    this.pressing = false;
    this.dragging = false;
    this.registry.clearSource("system");
  };

  private onPointerLeave = (): void => {
    this.pointerInsideViewport = false;
    this.restoreDocumentCursor();
  };

  private onPointerEnter = (event: PointerEvent): void => {
    this.pointerInsideViewport = true;
    this.samplePointer(event.clientX, event.clientY, event.pointerType);
    this.reticleVisual = { ...this.pointerActual };
    this.setDocumentCursor();
  };

  private onWindowBlur = (): void => {
    this.pointerInsideViewport = false;
    this.pressing = false;
    this.dragging = false;
    this.registry.clear();
    this.restoreDocumentCursor();
  };

  private onWindowFocus = (): void => {
    this.pointerInsideViewport = true;
    this.setDocumentCursor();
  };

  private onVisibilityChange = (): void => {
    this.documentVisible = !document.hidden;
    if (!this.documentVisible) {
      this.pressing = false;
      this.dragging = false;
      this.registry.clear();
      this.restoreDocumentCursor();
    } else {
      this.reticleVisual = { ...this.pointerActual };
      this.setDocumentCursor();
    }
  };

  private onFocusChange = (): void => {
    this.overTextInput = isTextInputElement(document.activeElement);
    this.setDocumentCursor();
  };

  private samplePointer(x: number, y: number, pointerType: string): void {
    this.lastPointer = { ...this.pointerActual };
    this.pointerActual.x = x;
    this.pointerActual.y = y;
    this.reticleVisual.x = x;
    this.reticleVisual.y = y;
    this.lastMoveTs = performance.now();
    this.pointerInsideViewport = x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
    this.modality = pointerType === "pen" ? "pen" : pointerType === "touch" ? "touch" : "mouse";
    if (this.pressing && Math.hypot(x - this.pressOrigin.x, y - this.pressOrigin.y) > DRAG_THRESHOLD_PX) this.dragging = true;
  }

  private publishUiTarget(element: Element | null): void {
    const target = getInteractiveTarget(element);
    if (!target || isTextInputElement(target)) {
      this.registry.clearSource("ui");
      return;
    }
    const rect = target.getBoundingClientRect();
    this.registry.publish({
      id: target.dataset.cursorTarget || target.id || `${target.tagName.toLowerCase()}-${Math.round(rect.left)}-${Math.round(rect.top)}`,
      kind: "ui",
      source: "ui",
      rect,
      priority: 125,
      confidence: 0.95,
      expiresAt: performance.now() + 120,
    });
  }

  private tick = (ts: number): void => {
    const rawDt = ts - this.lastTs;
    const dtMs = clamp(rawDt || 16.7, 1, 50);
    const dt = dtMs / 1000;
    this.lastTs = ts;
    this.measuredFrameMs = this.measuredFrameMs * 0.9 + dtMs * 0.1;

    const frame = this.updateFrame(ts, dt, dtMs);
    this.render(frame);
    this.raf = requestAnimationFrame(this.tick);
  };

  private updateFrame(now: number, dt: number, dtMs: number): CursorFrameState {
    const profile = resolveCursorProfile(this.config);
    const diagnostic = validateCursorProfile(profile);
    const policy = deriveRuntimePolicy(this.config, profile, this.measuredFrameMs, this.documentVisible);
    const resolved = this.registry.resolve(this.pointerActual, now, dtMs);

    const intent: CursorIntent = {
      pressing: this.pressing,
      dragging: this.dragging,
      overTextInput: this.overTextInput,
      wantsNativeCursor: this.overTextInput || this.modality === "touch" || !this.pointerInsideViewport || !this.documentVisible,
      pointerInsideViewport: this.pointerInsideViewport,
      documentVisible: this.documentVisible,
      modality: this.modality,
    };

    if (this.pressing && now - this.lastMoveTs > WATCHDOG_MS) {
      this.pressing = false;
      this.dragging = false;
      this.lockStrength = 0;
      this.registry.clearSource("cesium");
    }

    const lockedTarget = resolved.lockedTarget;
    const targetPoint = lockedTarget?.screenPosition ?? (lockedTarget?.rect ? {
      x: lockedTarget.rect.left + lockedTarget.rect.width / 2,
      y: lockedTarget.rect.top + lockedTarget.rect.height / 2,
    } : null);

    const targetLockStrength = lockedTarget && policy.lockAssistEnabled && !intent.dragging
      ? clamp(1 - lockedTarget.distance / 120, 0, 1) * policy.lockAssistStrength
      : 0;
    this.lockStrength += (targetLockStrength - this.lockStrength) * (1 - Math.exp(-18 * dt));

    // The custom reticle must remain centered on the real pointer position.
    // Lock assist can still influence visual emphasis, but it must not push the pointer skin off the cursor.
    this.reticleVisual.x = this.pointerActual.x;
    this.reticleVisual.y = this.pointerActual.y;

    this.velocity.x = (this.pointerActual.x - this.lastPointer.x) / Math.max(dtMs, 1);
    this.velocity.y = (this.pointerActual.y - this.lastPointer.y) / Math.max(dtMs, 1);

    const omega = 22;
    const recoilAcceleration = -2 * omega * this.recoilVelocity - omega * omega * this.recoil;
    this.recoilVelocity += recoilAcceleration * dt;
    this.recoil += this.recoilVelocity * dt;
    this.recoil = clamp(this.recoil, 0, 1.2);

    if (policy.trailsEnabled && !intent.dragging && Math.hypot(this.velocity.x, this.velocity.y) > 0.35) {
      this.spawnTrail(policy);
    }

    let mode = this.resolveMode(intent, resolved.selectedTarget, lockedTarget, policy);
    if (diagnostic.blocking) mode = "disabled";

    return {
      mode,
      pointerActual: { ...this.pointerActual },
      reticleVisual: { ...this.reticleVisual },
      velocity: { ...this.velocity },
      selectedTarget: resolved.selectedTarget,
      lockedTarget,
      lockStrength: this.lockStrength,
      recoil: this.recoil,
      effectsEnabled: policy.visualEffectsAllowed,
      policy,
      intent,
      debugReason: policy.disabledReason ?? diagnostic.message,
    };
  }

  private resolveMode(intent: CursorIntent, selectedTarget: CursorTarget | null, lockedTarget: CursorTarget | null, policy: CursorRuntimePolicy): CursorMode {
    if (!this.config.enabled || policy.disabledReason === "engine disabled") return "disabled";
    if (this.config.reducedMotion) return "reducedMotion";
    if (intent.wantsNativeCursor) return "disabled";
    if (intent.dragging) return "drag";
    if (intent.pressing) return "press";
    if (lockedTarget) return "lock";
    if (selectedTarget) return "hover";
    return "idle";
  }

  private spawnTrail(policy: CursorRuntimePolicy): void {
    const sample = this.trailPool[this.trailIndex % this.trailPool.length];
    this.trailIndex += 1;
    sample.x = this.reticleVisual.x;
    sample.y = this.reticleVisual.y;
    sample.life = Math.max(8, policy.trailBudget);
    sample.width = 1 + clamp(Math.hypot(this.velocity.x, this.velocity.y) * 3, 0, 5);
  }

  private render(frame: CursorFrameState): void {
    const hidden = frame.intent.wantsNativeCursor || frame.mode === "disabled";
    const accent = this.config.accentColor || "#7de3c9";
    if (this.reticle) {
      const speed = clamp(Math.hypot(frame.velocity.x, frame.velocity.y), 0, 2.4);
      const scale = 1 + speed * 0.05 - frame.recoil * frame.policy.recoilStrength * 0.08 + frame.lockStrength * 0.08;
      const rotation = Math.atan2(frame.velocity.y, frame.velocity.x) || 0;
      this.reticle.style.opacity = hidden ? "0" : frame.mode === "idle" ? "0.82" : "1";
      const centeredX = frame.reticleVisual.x - 21;
      const centeredY = frame.reticleVisual.y - 21;
      this.reticle.style.transform = `translate3d(${centeredX}px, ${centeredY}px, 0) rotate(${rotation * 0.08}rad) scale(${scale})`;
      this.reticle.style.filter = `drop-shadow(0 0 ${8 + frame.lockStrength * 18}px ${cssColorWithAlpha(accent, 0.34 + frame.lockStrength * 0.24)})`;
      this.reticle.style.color = accent;
      const ring = this.reticle.querySelector("[data-cursor-ring]");
      if (ring) ring.setAttribute("stroke", cssColorWithAlpha(accent, 0.76 + frame.lockStrength * 0.22));
    }

    this.renderCanvas(frame, accent);

    if (this.debug && (this.config.debug || (typeof window !== "undefined" && window.localStorage && localStorage.getItem("wwv-debug-cursor") === "1"))) {
      this.debug.style.display = "block";
      this.debug.textContent = [
        `mode: ${frame.mode}`,
        `target: ${frame.selectedTarget?.id ?? "none"}`,
        `locked: ${frame.lockedTarget?.id ?? "none"}`,
        `velocity: ${frame.velocity.x.toFixed(2)},${frame.velocity.y.toFixed(2)}`,
        `lock: ${frame.lockStrength.toFixed(2)} recoil: ${frame.recoil.toFixed(2)}`,
        `budget: t${frame.policy.trailBudget}/p${frame.policy.particleBudget}`,
        `reason: ${frame.debugReason ?? "nominal"}`,
      ].join("\n");
    }
  }

  private renderCanvas(frame: CursorFrameState, accent: string): void {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    if (!frame.effectsEnabled || frame.intent.wantsNativeCursor) return;

    for (const sample of this.trailPool) {
      if (sample.life <= 0) continue;
      const alpha = clamp(sample.life / Math.max(1, frame.policy.trailBudget), 0, 1);
      ctx.beginPath();
      ctx.fillStyle = cssColorWithAlpha(accent, alpha * 0.24);
      ctx.shadowColor = cssColorWithAlpha(accent, alpha * 0.38);
      ctx.shadowBlur = 12 * alpha;
      ctx.arc(sample.x, sample.y, sample.width * alpha, 0, Math.PI * 2);
      ctx.fill();
      sample.life -= 1 + (1 - resolveCursorProfile(this.config).bleedRate) * 4;
    }

    if (frame.lockedTarget && frame.lockStrength > 0.1) {
      const point = frame.lockedTarget.screenPosition ?? (frame.lockedTarget.rect ? {
        x: frame.lockedTarget.rect.left + frame.lockedTarget.rect.width / 2,
        y: frame.lockedTarget.rect.top + frame.lockedTarget.rect.height / 2,
      } : null);
      if (point) {
        ctx.beginPath();
        ctx.strokeStyle = cssColorWithAlpha(accent, frame.lockStrength * 0.26);
        ctx.lineWidth = 1;
        ctx.arc(point.x, point.y, 18 + frame.lockStrength * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private resizeCanvas = (): void => {
    if (!this.canvas || !this.ctx) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    this.canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private setDocumentCursor(): void {
    if (!this.config.enabled || this.overTextInput || !this.pointerInsideViewport || !this.documentVisible || this.modality === "touch") {
      this.restoreDocumentCursor();
      return;
    }
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";
  }

  private restoreDocumentCursor(): void {
    document.documentElement.style.cursor = "";
    document.body.style.cursor = "";
  }

  private updateReticleSvg(): void {
    if (!this.reticle) return;
    const design = this.config.cursorDesign || "reticle-v1";
    let svgContent = "";

    switch (design) {
      case "dot-trail":
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="21" cy="21" r="4.5" fill="currentColor"/>
            <circle cx="13" cy="21" r="2.5" fill="currentColor" opacity="0.35"/>
            <circle cx="29" cy="21" r="2.5" fill="currentColor" opacity="0.35"/>
          </svg>
        `;
        break;
      case "comet-tail":
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="comet-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="currentColor" stop-opacity="1"/>
                <stop offset="100%" stop-color="currentColor" stop-opacity="0.1"/>
              </linearGradient>
            </defs>
            <path d="M10 21h20" stroke="url(#comet-grad)" stroke-width="3" stroke-linecap="round"/>
            <circle cx="32" cy="21" r="3.5" fill="#fff"/>
          </svg>
        `;
        break;
      case "crosshair":
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 6v30M6 21h30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="21" cy="21" r="2.5" fill="#fff"/>
          </svg>
        `;
        break;
      case "ring-pulse":
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle data-cursor-ring cx="21" cy="21" r="10" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="21" cy="21" r="3.5" fill="currentColor"/>
          </svg>
        `;
        break;
      case "orbit":
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="21" cy="21" r="7" stroke="currentColor" stroke-width="1" fill="none"/>
            <circle cx="26" cy="16" r="2.2" fill="#FFD27A" />
            <circle cx="16" cy="26" r="2.2" fill="#9EE7FF" />
            <circle cx="21" cy="21" r="2.5" fill="#fff"/>
          </svg>
        `;
        break;
      case "pixel":
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="15" width="12" height="12" fill="#fff" />
            <rect x="17" y="17" width="8" height="8" fill="currentColor" />
          </svg>
        `;
        break;
      case "radar":
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="21" cy="21" r="12" stroke="currentColor" stroke-width="1.2" fill="none" />
            <path d="M21 21 L30 15" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            <circle cx="21" cy="21" r="2.5" fill="#fff"/>
          </svg>
        `;
        break;
      case "arrow":
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8 L30 20 L20 23 L16 30 L12 8" fill="currentColor" stroke="#fff" stroke-width="1" />
          </svg>
        `;
        break;
      case "vortex":
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="21" cy="21" r="10" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" />
            <circle cx="18" cy="16" r="1.5" fill="currentColor" />
            <circle cx="24" cy="26" r="1.5" fill="#C7A6FF" />
            <circle cx="21" cy="21" r="2.5" fill="#fff"/>
          </svg>
        `;
        break;
      case "reticle-v1":
      default:
        svgContent = `
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle data-cursor-ring cx="21" cy="21" r="11.5" stroke="rgba(125,227,201,.82)" stroke-width="1.1"/>
            <circle cx="21" cy="21" r="2.25" fill="rgba(255,255,255,.96)"/>
            <path d="M21 5.5V11.5M21 30.5V36.5M5.5 21H11.5M30.5 21H36.5" stroke="rgba(255,255,255,.9)" stroke-width="1.35" stroke-linecap="round"/>
            <path data-cursor-lock d="M12.5 12.5L16.5 12.5M25.5 12.5L29.5 12.5M12.5 29.5L16.5 29.5M25.5 29.5L29.5 29.5" stroke="rgba(166,123,234,.72)" stroke-width="1.1" stroke-linecap="round"/>
          </svg>
        `;
        break;
    }

    this.reticle.innerHTML = svgContent;
  }
}
