import type { InteractionMode } from '@/store/uiStore';

export type SpaceFocus = 'earth' | 'telescope';

export function getSpaceFocus(mode: InteractionMode, target: SpaceFocus): SpaceFocus | null {
  if (mode === 'telescope') return 'telescope';
  return mode === 'orbital' ? target : null;
}
