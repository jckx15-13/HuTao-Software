export type CursorMode = "idle" | "hover" | "lock" | "press" | "drag" | "reducedMotion" | "disabled";

export type CursorTargetKind = "ui" | "cesiumEntity" | "mapObject" | "background";
export type CursorTargetSource = "ui" | "cesium" | "system";
export type CursorPointerModality = "mouse" | "touch" | "pen" | "trackpad" | "keyboard";

export type CursorVector = {
  x: number;
  y: number;
};

export type CursorTarget = {
  id: string;
  kind: CursorTargetKind;
  source: CursorTargetSource;
  rect?: DOMRect;
  screenPosition?: CursorVector;
  priority: number;
  confidence: number;
  distance: number;
  hoverDwellMs: number;
  createdAt: number;
  expiresAt: number;
  explicitLock?: boolean;
};

export type CursorIntent = {
  pressing: boolean;
  dragging: boolean;
  overTextInput: boolean;
  wantsNativeCursor: boolean;
  pointerInsideViewport: boolean;
  documentVisible: boolean;
  modality: CursorPointerModality;
};

export type CursorRuntimePolicy = {
  visualEffectsAllowed: boolean;
  trailsEnabled: boolean;
  particlesEnabled: boolean;
  recoilEnabled: boolean;
  smoothingEnabled: boolean;
  lockAssistEnabled: boolean;
  chromaticEnabled: boolean;
  trailBudget: number;
  particleBudget: number;
  smoothingStrength: number;
  lockAssistStrength: number;
  recoilStrength: number;
  disabledReason?: string;
};

export type CursorProfileId = "tactical" | "heavy-sim" | "twitch-vector" | "cinematic";

export type CursorEngineConfig = {
  enabled: boolean;
  cursorDesign: string;
  profileId?: CursorProfileId;
  reducedMotion: boolean;
  appHighLoad: boolean;
  animationIntensity: number;
  accentColor?: string;
  particleEffects?: boolean;
  debug?: boolean;
};

export type CursorProfile = {
  id: CursorProfileId;
  label: string;
  trackingWeight: number;
  snapSpeed: number;
  trailLength: number;
  bleedRate: number;
  lockAssist: number;
  recoil: number;
  glow: number;
};

export type CursorFrameState = {
  mode: CursorMode;
  pointerActual: CursorVector;
  reticleVisual: CursorVector;
  velocity: CursorVector;
  selectedTarget: CursorTarget | null;
  lockedTarget: CursorTarget | null;
  lockStrength: number;
  recoil: number;
  effectsEnabled: boolean;
  policy: CursorRuntimePolicy;
  intent: CursorIntent;
  debugReason?: string;
};

export type CursorDiagnosticTier =
  | "UNSTABLE MATRIX"
  | "IMPEDED KINETIC PROFILE"
  | "BASELINE CALIBRATION"
  | "TELEMETRY-OPTIMIZED ENGINE"
  | "ANOMALOUS HYPER-DRIVE";

export type CursorDiagnostic = {
  tier: CursorDiagnosticTier;
  blocking: boolean;
  message: string;
  fields: string[];
};

export type CursorEngineLifecycle = {
  init(): void;
  attach(mount: HTMLElement): void;
  detach(): void;
  destroy(): void;
  setEnabled(enabled: boolean): void;
  updateConfig(config: Partial<CursorEngineConfig>): void;
  publishTarget(target: Omit<Partial<CursorTarget>, "createdAt" | "hoverDwellMs"> & Pick<CursorTarget, "id" | "kind" | "source">): void;
  clearSourceTargets(source: CursorTargetSource): void;
};
