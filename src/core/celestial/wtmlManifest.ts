/**
 * WTML manifest adapter.
 *
 * WorldWide Telescope publishes small WTML (XML) manifests that describe where
 * a place sits on the sky and which tiled imagery backs it. SilverWolf treats
 * those manifests purely as *data*: this module turns a manifest into plain
 * coordinates and attribution, which the native Cesium celestial layer renders
 * itself. Nothing here loads, embeds, or talks to the WWT viewer application.
 *
 * Kept free of Cesium imports so it stays cheap to unit test.
 */

export interface NativeWtmlCollection {
  url: string;
  name: string;
  /** Right ascension in decimal hours (0–24). */
  raHours: number;
  /** Declination in decimal degrees (−90..+90). */
  decDegrees: number;
  thumbnailUrl?: string;
  credits?: string;
  creditsUrl?: string;
}

/**
 * Only HTTPS manifests are accepted, plus plain HTTP on loopback so a local
 * operator can serve mirrored manifests offline without a certificate.
 */
export function safeManifestUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function firstMatch(xml: string, expression: RegExp): string | undefined {
  return expression.exec(xml)?.[1]?.trim() || undefined;
}

function readAttribute(attributes: string, name: string): string | undefined {
  return new RegExp(`${name}=["']([^"']+)["']`, 'i').exec(attributes)?.[1];
}

/**
 * Returns null when the manifest carries no usable sky position — callers treat
 * that as "no media pin", never as a silent zero-coordinate placement.
 */
export function parseWtmlCollection(xml: string, url: string): NativeWtmlCollection | null {
  const place = /<Place\b([^>]*)>/i.exec(xml)?.[1] || '';
  const imageSet = /<ImageSet\b([^>]*)>/i.exec(xml)?.[1] || '';

  const raHours = Number(readAttribute(place, 'RA'));
  const decDegrees = Number(readAttribute(place, 'Dec'));
  if (!Number.isFinite(raHours) || !Number.isFinite(decDegrees)) return null;

  const thumbnailUrl = firstMatch(xml, /<ThumbnailUrl>([^<]+)<\/ThumbnailUrl>/i) || readAttribute(place, 'Thumbnail');

  return {
    url,
    name: readAttribute(place, 'Name') || readAttribute(imageSet, 'Name') || 'WTML collection',
    raHours,
    decDegrees,
    // Manifests still advertise http thumbnails; upgrade so they load on an
    // https origin instead of being blocked as mixed content.
    thumbnailUrl: thumbnailUrl?.replace(/^http:/i, 'https:'),
    credits: firstMatch(xml, /<Credits>([^<]+)<\/Credits>/i),
    creditsUrl: firstMatch(xml, /<CreditsUrl>([^<]+)<\/CreditsUrl>/i)
  };
}
