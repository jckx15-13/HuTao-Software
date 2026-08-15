import { useEffect, useMemo, useRef } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { getGreenwichMeanSiderealDegrees } from '@/lib/earthObserverProjection';
import { parseWtmlCollection, safeManifestUrl, type NativeWtmlCollection } from './wtmlManifest';
import { paletteForLayer } from './SurveyRegistry';
import { MEDIA_CATALOG } from './mediaCatalog';

const CELESTIAL_RADIUS = Cesium.Ellipsoid.WGS84.maximumRadius + 102_000_000;
const STAR_COUNT = 640;
const NATIVE_DATA_SOURCE_NAME = 'silver-wolf-native-celestial-sky';

// Palettes now come from the survey registry, so the colours an operator sees
// and the survey provenance they can inspect are the same record.
const paletteFor = paletteForLayer;

function toCelestialCartesian(
  raHours: number,
  decDegrees: number,
  date: Date,
  radius = CELESTIAL_RADIUS
): Cesium.Cartesian3 {
  const earthFixedRa = raHours * 15 - getGreenwichMeanSiderealDegrees(date);
  const ra = Cesium.Math.toRadians(earthFixedRa);
  const dec = Cesium.Math.toRadians(decDegrees);
  return new Cesium.Cartesian3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.cos(dec) * Math.sin(ra),
    radius * Math.sin(dec)
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
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        });
      });

      if (settings.showGrid) {
        for (let dec = -75; dec <= 75; dec += 15) {
          const positions = Array.from({ length: 49 }, (_, i) => toCelestialCartesian(i / 2, dec, date));
          source.entities.add({
            id: `native-grid-dec-${dec}`,
            polyline: { positions, width: 1, material: Cesium.Color.fromCssColorString(palette.grid).withAlpha(0.28) }
          });
        }
        for (let ra = 0; ra < 24; ra += 2) {
          const positions = Array.from({ length: 37 }, (_, i) => toCelestialCartesian(ra, -90 + i * 5, date));
          source.entities.add({
            id: `native-grid-ra-${ra}`,
            polyline: { positions, width: 1, material: Cesium.Color.fromCssColorString(palette.grid).withAlpha(0.2) }
          });
        }
      }

      // Media catalogue pins. Positions and attribution are local, so these
      // render identically online and offline; only a mirrored thumbnail can
      // upgrade the procedural pin, and a missing one is never fetched.
      for (const entry of MEDIA_CATALOG) {
        source.entities.add({
          id: `native-media-pin-${entry.id}`,
          name: entry.name,
          position: toCelestialCartesian(entry.raHours, entry.decDegrees, date, CELESTIAL_RADIUS + 900_000),
          billboard: {
            image: entry.thumbnail || createPinFallback(palette.glow),
            width: 30,
            height: 30,
            color: Cesium.Color.WHITE.withAlpha(0.88),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: entry.catalogId,
            font: 'bold 7pt JetBrains Mono, monospace',
            fillColor: Cesium.Color.fromCssColorString(palette.star).withAlpha(0.82),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(0, -32),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            showBackground: true,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.6),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          properties: {
            catalogId: entry.catalogId,
            objectType: entry.type,
            sourceUrl: entry.sourcePageUrl,
            credits: entry.attribution,
            license: entry.license
          }
        });
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
            disableDepthTestDistance: Number.POSITIVE_INFINITY
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
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          properties: {
            sourceUrl: collection.url,
            credits: collection.credits || 'WTML source',
            creditsUrl: collection.creditsUrl || collection.url
          }
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
    return () => {
      cancelled = true;
    };
  }, [collectionUrl, viewer]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const source = sourceRef.current;
    if (!source) return;
    source.show = isActive;
    viewer.scene.requestRender();
  }, [viewer, isActive, settings]);
}

export { parseWtmlCollection, safeManifestUrl };
export type { NativeWtmlCollection };
