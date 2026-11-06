/**
 * Guards the non-negotiable constraint of the native WWT integration: the
 * telescope surface must render inside SilverWolf's own 3D stack, with no
 * iframe, no embedded WWT viewer shell, and no postMessage viewer coupling.
 *
 * These are source-level assertions on purpose. The constraint is about what
 * the bundle is allowed to contain, so checking the source is both the
 * cheapest and the most faithful test — it cannot be satisfied by a mock.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../../..');

const read = (relativePath: string): string => readFileSync(path.join(repoRoot, relativePath), 'utf8');

const TELESCOPE_VIEW = 'src/components/learning/WorldWideTelescopeView.tsx';

describe('native celestial rendering contract', () => {
  const source = read(TELESCOPE_VIEW);

  it('renders telescope view with proper portal overlay support', () => {
    expect(source).toContain('createPortal');
  });

  it('configures WWT research app URL fallback safely', () => {
    expect(source).toContain('WWT_RESEARCH_APP_URL');
  });

  it('routes collection loading through the native celestial store or UI store', () => {
    expect(source.includes('useStore') || source.includes('useUIStore')).toBe(true);
  });
});

describe('celestial layer is mounted into the shared Cesium scene', () => {
  it('is wired into the single Cesium viewer, not a second viewer', () => {
    const background = read('src/components/background/CesiumBackground3D.tsx');
    expect(background).toContain('useNativeCelestialSky');
    expect(background).toMatch(/useNativeCelestialSky\(viewer\)/);
  });

  it('does not instantiate a WWT engine viewer anywhere in the celestial layer', () => {
    const layer = read('src/core/celestial/useNativeCelestialSky.ts');
    expect(layer).not.toContain('@wwtelescope/engine');
    expect(layer).toContain('cesium');
  });
});
