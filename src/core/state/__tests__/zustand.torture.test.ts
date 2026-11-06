import { describe, it, expect, beforeEach } from 'vitest';
import type { GeoEntity } from '@/core/plugins/PluginTypes';

// Global polyfill for localStorage and window before store initialization
const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = String(value); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
  length: 0,
  key: (_i: number) => null,
};

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage?.getItem) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
}

import { useStore } from '../store';

describe('Zustand Adversarial Stress & Torture Test Suite', () => {
  beforeEach(() => {
    // Reset favorites before each test
    const state = useStore.getState();
    if (state.favorites) {
      state.favorites.forEach((fav) => state.removeFavorite(fav.id));
    }
  });

  it('handles 1,000 rapid concurrent store mutations without race conditions', async () => {
    const start = performance.now();
    const mutationCount = 1000;

    const promises = Array.from({ length: mutationCount }, (_, i) => {
      return new Promise<void>((resolve) => {
        const entity: GeoEntity = {
          id: `fav-stress-${i}`,
          pluginId: 'test-plugin',
          label: `Favorite item ${i}`,
          latitude: 0,
          longitude: 0,
          timestamp: new Date(),
          properties: {},
        };
        useStore.getState().addFavorite(entity, 'Test Plugin');
        resolve();
      });
    });

    await Promise.all(promises);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(2000); // Must process 1,000 mutations in under 2 seconds
    const state = useStore.getState();
    expect(state.favorites.length).toBe(mutationCount);
  });

  it('handles rapid layer toggling and filter updates immutably', () => {
    const initialLayers = useStore.getState().layers;
    useStore.getState().toggleLayer('earthquakes');
    const updatedLayers = useStore.getState().layers;

    expect(initialLayers).not.toBe(updatedLayers); // Immutability reference check
    expect(updatedLayers['earthquakes']).toBeDefined();
  });

  it('sanitizes extreme and malformed favorite payloads gracefully', () => {
    const extremeEntity: GeoEntity = {
      id: 'extreme-fav-payload',
      pluginId: '<script>alert("xss")</script>',
      label: 'X'.repeat(50000), // Extreme string length
      latitude: NaN,
      longitude: NaN,
      timestamp: new Date(),
      properties: {},
    };

    expect(() => {
      useStore.getState().addFavorite(extremeEntity, 'Test Plugin');
    }).not.toThrow();

    const favorites = useStore.getState().favorites;
    const added = favorites.find((f) => f.id === 'extreme-fav-payload');
    expect(added).toBeDefined();
  });

  it('maintains state immutability across rapid store reads and writes', () => {
    const initialFavorites = useStore.getState().favorites;
    const testEntity: GeoEntity = {
      id: 'immutability-check',
      pluginId: 'test',
      label: 'Immutability test',
      latitude: 10,
      longitude: 10,
      timestamp: new Date(),
      properties: {},
    };

    useStore.getState().addFavorite(testEntity, 'Test Plugin');

    const newFavorites = useStore.getState().favorites;
    expect(initialFavorites).not.toBe(newFavorites);
  });
});
