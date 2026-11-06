import { describe, expect, it } from 'vitest';
import { parseWtmlCollection, safeManifestUrl } from '../wtmlManifest';

const JWST_MANIFEST = `<?xml version="1.0"?>
<Folder Name="JWST">
  <Place Name="Rho Ophiuchi" RA="16.45" Dec="-23.4" Thumbnail="http://example.org/thumb.jpg">
    <ForegroundImageSet>
      <ImageSet Name="JWST NIRCam" BandPass="Visible" />
    </ForegroundImageSet>
  </Place>
  <Credits>NASA, ESA, CSA</Credits>
  <CreditsUrl>https://example.org/credits</CreditsUrl>
</Folder>`;

describe('parseWtmlCollection', () => {
  it('extracts sky position, name and attribution from a manifest', () => {
    const parsed = parseWtmlCollection(JWST_MANIFEST, 'https://example.org/index.wtml');

    expect(parsed).toMatchObject({
      url: 'https://example.org/index.wtml',
      name: 'Rho Ophiuchi',
      raHours: 16.45,
      decDegrees: -23.4,
      credits: 'NASA, ESA, CSA',
      creditsUrl: 'https://example.org/credits'
    });
  });

  it('upgrades http thumbnails so they are not blocked as mixed content', () => {
    const parsed = parseWtmlCollection(JWST_MANIFEST, 'https://example.org/index.wtml');
    expect(parsed?.thumbnailUrl).toBe('https://example.org/thumb.jpg');
  });

  it('falls back to the image set name when the place is unnamed', () => {
    const xml = '<Place RA="1" Dec="2"><ImageSet Name="DSS Color" /></Place>';
    expect(parseWtmlCollection(xml, 'https://e.org/a.wtml')?.name).toBe('DSS Color');
  });

  it('returns null rather than placing a pin at 0,0 when coordinates are missing', () => {
    expect(parseWtmlCollection('<Folder><Place Name="No coords" /></Folder>', 'https://e.org/a.wtml')).toBeNull();
  });

  it('returns null for a non-numeric position', () => {
    expect(parseWtmlCollection('<Place RA="abc" Dec="4" />', 'https://e.org/a.wtml')).toBeNull();
  });

  it('returns null for input that is not a manifest at all', () => {
    expect(parseWtmlCollection('<html><body>404</body></html>', 'https://e.org/a.wtml')).toBeNull();
  });
});

describe('safeManifestUrl', () => {
  it('accepts https manifests', () => {
    expect(safeManifestUrl('https://data1.wwtassets.org/a/index.wtml')).toBe(
      'https://data1.wwtassets.org/a/index.wtml'
    );
  });

  it('accepts plain http on loopback so offline operators can mirror manifests', () => {
    expect(safeManifestUrl('http://127.0.0.1:8000/mirror.wtml')).toBe('http://127.0.0.1:8000/mirror.wtml');
    expect(safeManifestUrl('http://localhost:8000/mirror.wtml')).toBe('http://localhost:8000/mirror.wtml');
  });

  it('rejects plain http on a remote host', () => {
    expect(safeManifestUrl('http://example.org/a.wtml')).toBeNull();
  });

  it('rejects non-http schemes and malformed input', () => {
    expect(safeManifestUrl('javascript:alert(1)')).toBeNull();
    expect(safeManifestUrl('file:///etc/passwd')).toBeNull();
    expect(safeManifestUrl('not a url')).toBeNull();
    expect(safeManifestUrl(null)).toBeNull();
    expect(safeManifestUrl('')).toBeNull();
  });
});
