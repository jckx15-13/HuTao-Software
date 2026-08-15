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

  it('renders no iframe in the telescope view', () => {
    expect(source).not.toMatch(/<iframe/i);
  });

  it('does not reference the retired WWT research viewer shell', () => {
    expect(source).not.toContain('web.wwtassets.org');
    expect(source).not.toContain('WWT_RESEARCH_APP_URL');
  });

  it('does not postMessage into an embedded viewer', () => {
    expect(source).not.toContain('postToWWT');
    expect(source).not.toContain('contentWindow');
  });

  it('keeps WTML strictly as a data manifest, not a viewer payload', () => {
    // A .wtml URL may still appear as a *data source*, which is intended.
    // What must not appear is a command that hands it to an embedded viewer.
    expect(source).not.toContain('load_image_collection');
    expect(source).not.toContain('set_background_by_name');
  });

  it('routes collection loading through the native celestial store', () => {
    expect(source).toContain('setCelestialCollectionUrl');
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
