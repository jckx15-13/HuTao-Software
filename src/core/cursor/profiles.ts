import type { CursorEngineConfig, CursorProfile, CursorProfileId, CursorRuntimePolicy } from "./types";

export const CURSOR_PROFILE_MAP: Record<string, CursorProfileId> = {
  "reticle-v1": "tactical",
  crosshair: "tactical",
  radar: "tactical",
  arrow: "twitch-vector",
  pixel: "twitch-vector",
  "dot-trail": "twitch-vector",
  orbit: "heavy-sim",
  "ring-pulse": "heavy-sim",
  "comet-tail": "cinematic",
  vortex: "cinematic",
};

export const CURSOR_PROFILES: Record<CursorProfileId, CursorProfile> = {
  tactical: {
    id: "tactical",
    label: "Tactical Reticle",
    trackingWeight: 0.84,
    snapSpeed: 18,
    trailLength: 18,
    bleedRate: 0.86,
    lockAssist: 0.72,
    recoil: 0.62,
    glow: 0.65,
  },
  "heavy-sim": {
    id: "heavy-sim",
    label: "Heavy Simulation",
    trackingWeight: 0.64,
    snapSpeed: 12,
    trailLength: 22,
    bleedRate: 0.9,
    lockAssist: 0.82,
    recoil: 0.72,
    glow: 0.58,
  },
  "twitch-vector": {
    id: "twitch-vector",
    label: "Twitch Vector",
    trackingWeight: 0.96,
    snapSpeed: 30,
    trailLength: 10,
    bleedRate: 0.78,
    lockAssist: 0.42,
    recoil: 0.5,
    glow: 0.48,
  },
  cinematic: {
    id: "cinematic",
    label: "Cinematic Sci-Fi",
    trackingWeight: 0.74,
    snapSpeed: 15,
    trailLength: 32,
    bleedRate: 0.92,
    lockAssist: 0.78,
    recoil: 0.78,
    glow: 0.92,
  },
};

export function resolveCursorProfile(config: CursorEngineConfig): CursorProfile {
  const profileId = config.profileId ?? CURSOR_PROFILE_MAP[config.cursorDesign] ?? "tactical";
  return CURSOR_PROFILES[profileId] ?? CURSOR_PROFILES.tactical;
}

export function deriveRuntimePolicy(
  config: CursorEngineConfig,
  profile: CursorProfile,
  measuredFrameMs: number,
  documentVisible: boolean
): CursorRuntimePolicy {
  const animation = Number.isFinite(config.animationIntensity) ? Math.max(0, Math.min(1, config.animationIntensity)) : 0.7;
  const highFrameCost = measuredFrameMs > 26;
  const severeFrameCost = measuredFrameMs > 42;
  const disabledReason = !config.enabled
    ? "engine disabled"
    : !documentVisible
      ? "document hidden"
      : config.appHighLoad
        ? "app high-load mode"
        : undefined;

  const effectsAllowed = config.enabled && documentVisible && !config.reducedMotion && !config.appHighLoad && animation > 0.05;
  const particleBudget = effectsAllowed && !severeFrameCost && config.particleEffects !== false
    ? Math.max(4, Math.round(profile.trailLength * animation))
    : 0;
  const trailBudget = effectsAllowed && !highFrameCost
    ? Math.max(4, Math.round(profile.trailLength * animation))
    : effectsAllowed && !severeFrameCost
      ? 4
      : 0;

  return {
    visualEffectsAllowed: effectsAllowed,
    trailsEnabled: trailBudget > 0,
    particlesEnabled: particleBudget > 0,
    recoilEnabled: config.enabled && documentVisible && !config.appHighLoad && profile.recoil > 0,
    smoothingEnabled: config.enabled && !config.reducedMotion && !severeFrameCost,
    lockAssistEnabled: config.enabled && documentVisible && !config.reducedMotion && !config.appHighLoad && profile.lockAssist > 0,
    chromaticEnabled: effectsAllowed && animation > 0.66 && !highFrameCost,
    trailBudget,
    particleBudget,
    smoothingStrength: config.reducedMotion ? 1 : Math.max(0.3, Math.min(1, profile.trackingWeight)),
    lockAssistStrength: effectsAllowed ? profile.lockAssist : 0,
    recoilStrength: config.reducedMotion ? 0.12 : profile.recoil,
    disabledReason,
  };
}
