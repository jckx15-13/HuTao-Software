import type { CursorEngineLifecycle, CursorTarget, CursorTargetSource } from "./types";

let activeCursorEngine: CursorEngineLifecycle | null = null;

export function setActiveCursorEngine(engine: CursorEngineLifecycle | null): void {
  activeCursorEngine = engine;
}

export function publishCursorTarget(
  target: Omit<Partial<CursorTarget>, "createdAt" | "hoverDwellMs"> & Pick<CursorTarget, "id" | "kind" | "source">
): void {
  activeCursorEngine?.publishTarget(target);
}

export function clearCursorSourceTargets(source: CursorTargetSource): void {
  activeCursorEngine?.clearSourceTargets(source);
}
