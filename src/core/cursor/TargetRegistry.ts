import type { CursorTarget, CursorTargetSource, CursorVector } from "./types";

const KIND_PRIORITY: Record<CursorTarget["kind"], number> = {
  ui: 100,
  cesiumEntity: 76,
  mapObject: 42,
  background: 0,
};

function getTargetPoint(target: CursorTarget): CursorVector | null {
  if (target.screenPosition) return target.screenPosition;
  if (target.rect) {
    return {
      x: target.rect.left + target.rect.width / 2,
      y: target.rect.top + target.rect.height / 2,
    };
  }
  return null;
}

function distanceToTarget(pointer: CursorVector, target: CursorTarget): number {
  if (target.rect) {
    const dx = pointer.x < target.rect.left ? target.rect.left - pointer.x : pointer.x > target.rect.right ? pointer.x - target.rect.right : 0;
    const dy = pointer.y < target.rect.top ? target.rect.top - pointer.y : pointer.y > target.rect.bottom ? pointer.y - target.rect.bottom : 0;
    return Math.hypot(dx, dy);
  }
  const point = getTargetPoint(target);
  if (!point) return Number.POSITIVE_INFINITY;
  return Math.hypot(pointer.x - point.x, pointer.y - point.y);
}

function scoreTarget(target: CursorTarget): number {
  const priority = target.priority || KIND_PRIORITY[target.kind];
  const distanceScore = Math.max(0, 60 - Math.min(60, target.distance));
  const dwellScore = Math.min(18, target.hoverDwellMs / 35);
  const confidenceScore = Math.max(0, Math.min(1, target.confidence)) * 40;
  const explicitScore = target.explicitLock ? 35 : 0;
  return priority + distanceScore + dwellScore + confidenceScore + explicitScore;
}

export class CursorTargetRegistry {
  private readonly candidates = new Map<string, CursorTarget>();
  private selectedId: string | null = null;
  private lockedId: string | null = null;

  publish(target: Omit<Partial<CursorTarget>, "createdAt" | "hoverDwellMs"> & Pick<CursorTarget, "id" | "kind" | "source">, now = performance.now()): void {
    const existing = this.candidates.get(target.id);
    const createdAt = existing?.createdAt ?? now;
    this.candidates.set(target.id, {
      id: target.id,
      kind: target.kind,
      source: target.source,
      rect: target.rect,
      screenPosition: target.screenPosition,
      priority: target.priority ?? KIND_PRIORITY[target.kind],
      confidence: target.confidence ?? 0.8,
      distance: existing?.distance ?? Number.POSITIVE_INFINITY,
      hoverDwellMs: existing?.hoverDwellMs ?? 0,
      createdAt,
      expiresAt: target.expiresAt ?? now + 180,
      explicitLock: target.explicitLock,
    });
  }

  clearSource(source: CursorTargetSource): void {
    for (const [id, target] of this.candidates) {
      if (target.source === source) this.candidates.delete(id);
    }
    if (this.selectedId && !this.candidates.has(this.selectedId)) this.selectedId = null;
    if (this.lockedId && !this.candidates.has(this.lockedId)) this.lockedId = null;
  }

  clear(): void {
    this.candidates.clear();
    this.selectedId = null;
    this.lockedId = null;
  }

  resolve(pointer: CursorVector, now: number, dtMs: number): { selectedTarget: CursorTarget | null; lockedTarget: CursorTarget | null; candidates: CursorTarget[] } {
    const current: CursorTarget[] = [];
    for (const [id, target] of this.candidates) {
      if (target.expiresAt <= now) {
        this.candidates.delete(id);
        continue;
      }
      target.distance = distanceToTarget(pointer, target);
      target.hoverDwellMs = target.distance <= 36 || target.explicitLock ? target.hoverDwellMs + dtMs : Math.max(0, target.hoverDwellMs - dtMs * 2);
      current.push(target);
    }

    current.sort((a, b) => scoreTarget(b) - scoreTarget(a));
    const selectedTarget = current[0] ?? null;
    this.selectedId = selectedTarget?.id ?? null;

    const selectedScore = selectedTarget ? scoreTarget(selectedTarget) : 0;
    if (selectedTarget && (selectedTarget.explicitLock || selectedTarget.hoverDwellMs > 120 || selectedScore > 150)) {
      this.lockedId = selectedTarget.id;
    } else if (this.lockedId) {
      const locked = this.candidates.get(this.lockedId);
      if (!locked || locked.distance > 110 || locked.expiresAt <= now) this.lockedId = null;
    }

    return {
      selectedTarget,
      lockedTarget: this.lockedId ? this.candidates.get(this.lockedId) ?? null : null,
      candidates: current,
    };
  }
}
