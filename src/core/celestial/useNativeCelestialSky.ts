import { useEffect, useMemo, useRef } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { getGreenwichMeanSiderealDegrees } from '@/lib/earthObserverProjection';

const CELESTIAL_RADIUS = Cesium.Ellipsoid.WGS84.maximumRadius + 102_000_000;
const STAR_COUNT = 640;
const NATIVE_DATA_SOURCE_NAME = 'silver-wolf-native-celestial-sky';

type SurveyPalette = {
  star: string;
  grid: string;
  glow: string;
};

export interface NativeWtmlCollection {
  url: string;
  name: string;
  raHours: number;
  decDegrees: number;
  thumbnailUrl?: string;
  credits?: string;
  creditsUrl?: string;
}

const PALETTES: Record<string, SurveyPalette> = {
  'Digitized Sky Survey (Color)': { star: '#d5edff', grid: '#78b9e8', glow: '#5bb8ff' },
  'Hubble Space Telescope Imagery': { star: '#f2ddff', grid: '#bc8bff', glow: '#ab5cff' },
  'RASS: ROSAT All Sky Survey (X-ray)': { star: '#d6faff', grid: '#39dcff', glow: '#00b8ff' },
  'Planck Dust & Gas': { star: '#ffe7b5', grid: '#f0a850', glow: '#ff7b36' },
  'VLSS: VLA Low-frequency Sky Survey (Radio)': { star: '#d8ffd9', grid: '#64df88', glow: '#22b573' },
  '3D Solar System View': { star: '#dff8ff', grid: '#51e0ff', glow: '#16b5d7' },
};

function paletteFor(layer: string): SurveyPalette {
  return PALETTES[layer] || PALETTES['3D Solar System View'];
}

function safeManifestUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
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

export function parseWtmlCollection(xml: string, url: string): NativeWtmlCollection | null {
  const place = /<Place\b([^>]*)>/i.exec(xml)?.[1] || '';
  const imageSet = /<ImageSet\b([^>]*)>/i.exec(xml)?.[1] || '';
  const readAttribute = (attributes: string, name: string): string | undefined =>
    new RegExp(`${name}=["']([^"']+)["']`, 'i').exec(attributes)?.[1];

  const raHours = Number(readAttribute(place, 'RA'));
  const decDegrees = Number(readAttribute(place, 'Dec'));
  if (!Number.isFinite(raHours) || !Number.isFinite(decDegrees)) return null;

  const thumbnailUrl = firstMatch(xml, /<ThumbnailUrl>([^<]+)<\/ThumbnailUrl>/i)
    || readAttribute(place, 'Thumbnail');
  const credits = firstMatch(xml, /<Credits>([^<]+)<\/Credits>/i);
  const creditsUrl = firstMatch(xml, /<CreditsUrl>([^<]+)<\/CreditsUrl>/i);

  return {
    url,
    name: readAttribute(place, 'Name') || readAttribute(imageSet, 'Name') || 'WTML collection',
    raHours,
    decDegrees,
    thumbnailUrl: thumbnailUrl?.replace(/^http:/i, 'https:'),
    credits,
    creditsUrl,
  };
}

function toCelestialCartesian(raHours: number, decDegrees: number, date: Date, radius = CELESTIAL_RADIUS): Cesium.Cartesian3 {
  const earthFixedRa = (raHours * 15) - getGreenwichMeanSiderealDegrees(date);
  const ra = Cesium.Math.toRadians(earthFixedRa);
  const dec = Cesium.Math.toRadians(decDegrees);
  return new Cesium.Cartesian3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.cos(dec) * Math.sin(ra),
    radius * Math.sin(dec),
  );
}

function seededStars(): Array<{ raHours: number; decDegrees: number; magnitude: number }> {
  return Array.from({ length: STAR_COUNT }, (_, index) => {
    const fraction = (index + 0.5) / STAR_COUNT;
    const z = 1 - 2 * fraction;
    const raHours = ((index * 137.50776405003785) % 360) / 15;
    const decDegrees = Cesium.Math.toDegrees(Math.asin(z));
    const magnitude = 0.7 + ((index * 19) % 73) / 16;
    return { raHours, decDegrees, magnitude };
  });
}

function createPinFallback(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="${color}" fill-opacity=".18" stroke="${color}" stroke-width="3"/><path d="M32 12v40M12 32h40" stroke="${color}" stroke-width="3"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Renders the celestial layer directly in the active Cesium scene. It intentionally
 * uses no iframe or secondary WWT canvas: WTML is treated as a data manifest, while
 * all stars, grids, labels, and media pins are Cesium primitives/entities.
 */
export function useNativeCelestialSky(viewer: Cesium.Viewer | null) {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const spaceInteractionTarget = useUIStore((s) => s.spaceInteractionTarget);
  const layer = useUIStore((s) => s.wwtBackgroundLayer);
  const settings = useUIStore((s) => s.celestialOverlaySettings);
  const collectionUrl = useUIStore((s) => s.celestialCollectionUrl);
  const collectionRef = useRef<NativeWtmlCollection | null>(null);
  const sourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const starCollectionRef = useRef<Cesium.PointPrimitiveCollection | null>(null);
  const stars = useMemo(seededStars, []);

  const isActive = interactionMode === 'telescope' || spaceInteractionTarget === 'telescope';

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const source = new Cesium.CustomDataSource(NATIVE_DATA_SOURCE_NAME);
    const starCollection = new Cesium.PointPrimitiveCollection();
    viewer.scene.primitives.add(starCollection);
    viewer.dataSources.add(source);
    sourceRef.current = source;
    starCollectionRef.current = starCollection;

    const draw = () => {
      const date = new Date();
      const palette = paletteFor(layer);
      starCollection.removeAll();
      source.entities.removeAll();

      if (!isActive) {
        viewer.scene.requestRender();
        return;
      }

      stars.forEach((star, index) => {
        const magnitude = Math.max(0.15, Math.min(1, 1 - star.magnitude / 7));
        starCollection.add({
          id: `native-star-${index}`,
          position: toCelestialCartesian(star.raHours, star.decDegrees, date),
          pixelSize: Math.max(1.2, 4.8 - star.magnitude * 0.55),
          color: Cesium.Color.fromCssColorString(palette.star).withAlpha(0.16 + magnitude * 0.72),
          outlineColor: Cesium.Color.WHITE.withAlpha(magnitude * 0.55),
          outlineWidth: 0.45,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });
      });

      if (settings.showGrid) {
        for (let dec = -75; dec <= 75; dec += 15) {
          const positions = Array.from({ length: 49 }, (_, i) => toCelestialCartesian(i / 2, dec, date));
          source.entities.add({
            id: `native-grid-dec-${dec}`,
            polyline: { positions, width: 1, material: Cesium.Color.fromCssColorString(palette.grid).withAlpha(0.28) },
          });
        }
        for (let ra = 0; ra < 24; ra += 2) {
          const positions = Array.from({ length: 37 }, (_, i) => toCelestialCartesian(ra, -90 + i * 5, date));
          source.entities.add({
            id: `native-grid-ra-${ra}`,
            polyline: { positions, width: 1, material: Cesium.Color.fromCssColorString(palette.grid).withAlpha(0.2) },
          });
        }
      }

      const collection = collectionRef.current;
      if (collection) {
        source.entities.add({
          id: 'native-wtml-media-pin',
          name: collection.name,
          position: toCelestialCartesian(collection.raHours, collection.decDegrees, date, CELESTIAL_RADIUS + 1_400_000),
          billboard: {
            image: collection.thumbnailUrl || createPinFallback(palette.glow),
            width: 46,
            height: 46,
            color: Cesium.Color.WHITE.withAlpha(0.95),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: collection.name,
            font: 'bold 8pt JetBrains Mono, monospace',
            fillColor: Cesium.Color.fromCssColorString(palette.star),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(0, -48),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            showBackground: true,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          properties: {
            sourceUrl: collection.url,
            credits: collection.credits || 'WTML source',
            creditsUrl: collection.creditsUrl || collection.url,
          },
        });
      }

      viewer.scene.requestRender();
    };

    draw();
    const timer = window.setInterval(draw, 30_000);
    return () => {
      window.clearInterval(timer);
      if (!viewer.isDestroyed()) {
        viewer.scene.primitives.remove(starCollection);
        viewer.dataSources.remove(source, true);
        viewer.scene.requestRender();
      }
      sourceRef.current = null;
      starCollectionRef.current = null;
    };
  }, [viewer, stars, isActive, layer, settings.showGrid]);

  useEffect(() => {
    const safeUrl = safeManifestUrl(collectionUrl);
    if (!safeUrl) {
      collectionRef.current = null;
      return;
    }
    let cancelled = false;
    void fetch(safeUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`WTML fetch returned ${response.status}`);
        return response.text();
      })
      .then((xml) => {
        if (!cancelled) collectionRef.current = parseWtmlCollection(xml, safeUrl);
      })
      .catch(() => {
        if (!cancelled) collectionRef.current = null;
      })
      .finally(() => {
        if (!cancelled && viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
      });
    return () => { cancelled = true; };
  }, [collectionUrl, viewer]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const source = sourceRef.current;
    if (!source) return;
    source.show = isActive;
    viewer.scene.requestRender();
  }, [viewer, isActive, settings]);
}

