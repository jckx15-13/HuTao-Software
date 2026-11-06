import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { sanitizePersistedUiState } from '../core/defaults/uiDefaults';

/** Use a domain key first, falling back to the old combined preferences once. */
const legacyStorage: StateStorage = {
  getItem(name) {
    const current = localStorage.getItem(name);
    if (current !== null) return current;
    const legacy = localStorage.getItem('silver-wolf-v6-core');
    if (!legacy) return null;
    try {
      const parsed = JSON.parse(legacy);
      return JSON.stringify({ state: parsed.state, version: 0 });
    } catch { return null; }
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

export const domainStorage = createJSONStorage(() => {
  // Fail closed when browser storage is denied.
  void localStorage.length;
  return legacyStorage;
});

/** Hydration cannot add foreign keys or replace a domain's actions. */
export function mergeDomainState<S extends object>(persisted: unknown, current: S): S {
  const next = { ...current };
  if (!persisted || typeof persisted !== 'object') return next;
  const { state: sanitized, rejected } = sanitizePersistedUiState(persisted);
  for (const key of Object.keys(current) as (keyof S)[]) {
    if (typeof current[key] === 'function' || !Object.hasOwn(persisted, key)) continue;
    if (rejected.includes(String(key))) continue;
    const values = { ...persisted, ...sanitized } as Partial<S>;
    const value = values[key];
    if (key === 'customWallpaper' && typeof value === 'string' && value.startsWith('blob:')) continue;
    next[key] = value as S[keyof S];
  }
  return next;
}
