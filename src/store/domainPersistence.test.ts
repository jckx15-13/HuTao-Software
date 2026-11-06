import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    get length() { return values.size; },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('domain store compatibility', () => {
  it('routes updates only to their owner and keeps later setters authoritative', async () => {
    const { useUIStore, useThemeStore, useAstronomyStore, useChatStore } = await import('./uiStore');
    useUIStore.getState().updateSettings({ particleEffects: true, systemInstructions: 'hello' });
    useThemeStore.getState().setParticleEffects(false);
    expect(useUIStore.getState().particleEffects).toBe(false);
    expect(useChatStore.getState().systemInstructions).toBe('hello');
    expect(Object.hasOwn(useAstronomyStore.getState(), 'particleEffects')).toBe(false);
    useUIStore.setState(() => ({ particleEffects: true }));
    useThemeStore.getState().setParticleEffects(false);
    expect(useUIStore.getState().particleEffects).toBe(false);
  });

  it('hydrates legacy preferences while giving existing domain settings precedence', async () => {
    localStorage.setItem('silver-wolf-v6-core', JSON.stringify({ version: 9, state: {
      systemInstructions: 'saved prompt', notionEnabled: true,
      particleEffects: true, cameraSensitivity: 2.5,
    } }));
    localStorage.setItem('silver-wolf-v6-theme', JSON.stringify({ version: 0, state: { particleEffects: false } }));
    const { useUIStore, useChatStore, useThemeStore } = await import('./uiStore');
    expect(useUIStore.getState().systemInstructions).toBe('saved prompt');
    expect(useUIStore.getState().cameraSensitivity).toBe(2.5);
    expect(useThemeStore.getState().particleEffects).toBe(false);
    expect(Object.hasOwn(useChatStore.getState(), 'particleEffects')).toBe(false);
    useChatStore.getState().setSystemInstructions('new prompt');
    expect(JSON.parse(localStorage.getItem('silver-wolf-v6-chat')!).state.systemInstructions).toBe('new prompt');
  });

  it('does not restore or persist wallpaper object URLs', async () => {
    localStorage.setItem('silver-wolf-v6-theme', JSON.stringify({ version: 0, state: { customWallpaper: 'blob:expired' } }));
    const { useThemeStore } = await import('./themeStore');
    expect(useThemeStore.getState().customWallpaper).toBeNull();
    useThemeStore.getState().setCustomWallpaper('blob:temporary');
    expect(useThemeStore.getState().customWallpaper).toBe('blob:temporary');
    expect(JSON.parse(localStorage.getItem('silver-wolf-v6-theme')!).state.customWallpaper).toBeNull();
  });
});
