import type { CursorDiagnostic, CursorProfile } from "./types";

export function validateCursorProfile(profile: CursorProfile): CursorDiagnostic {
  const invalidFields: string[] = [];
  if (profile.snapSpeed <= 0) invalidFields.push("snapSpeed");
  if (profile.trackingWeight <= 0) invalidFields.push("trackingWeight");
  if (profile.trailLength < 0 || profile.trailLength > 96) invalidFields.push("trailLength");
  if (profile.bleedRate <= 0 || profile.bleedRate >= 1) invalidFields.push("bleedRate");
  if (profile.lockAssist < 0 || profile.recoil < 0 || profile.glow < 0) invalidFields.push("coefficients");

  if (invalidFields.length > 0) {
    return {
      tier: "UNSTABLE MATRIX",
      blocking: true,
      fields: invalidFields,
      message: "KINETIC COLLAPSE IMMINENT: Cursor profile rejected to protect thread stability.",
    };
  }

  if (profile.lockAssist > 0.9 && profile.snapSpeed < 9) {
    return {
      tier: "IMPEDED KINETIC PROFILE",
      blocking: false,
      fields: ["lockAssist", "snapSpeed"],
      message: "TACTICAL BOTTLENECK DETECTED: Target gravity is stronger than tracking recovery.",
    };
  }

  if (profile.trailLength === 0 && profile.lockAssist === 0 && profile.recoil === 0) {
    return {
      tier: "BASELINE CALIBRATION",
      blocking: false,
      fields: ["trailLength", "lockAssist", "recoil"],
      message: "STANDARD SIMULATION PROFILE ACTIVE: Advanced kinematics are offline.",
    };
  }

  if (profile.glow > 0.95 || profile.trailLength > 48) {
    return {
      tier: "ANOMALOUS HYPER-DRIVE",
      blocking: false,
      fields: ["glow", "trailLength"],
      message: "UNORTHODOX QUANTUM OVERLOAD: Visual distortion may cause fatigue during long sessions.",
    };
  }

  return {
    tier: "TELEMETRY-OPTIMIZED ENGINE",
    blocking: false,
    fields: [],
    message: "APEX TELEMETRY DETECTED: Cursor profile is balanced for responsive mapping.",
  };
}
