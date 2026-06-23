import { useEffect } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { TELESCOPE_PRESETS } from '@/data/telescopePresets';
import type { TelescopePreset } from '@/data/telescopePresets';
import { projectTelescopeTargetToEarth } from '@/lib/earthObserverProjection';

const EARTH_RADIUS_METERS = 6_378_137;
const TARGET_SHELL_RADIUS_METERS = 8_600_000;
const EARTH_ANCHOR_RADIUS_METERS = EARTH_RADIUS_METERS * 1.018;
const CAMERA_STANDOFF_METERS = 18_500_000;

function parseProjectionDate(value: unknown): Date {
  const parsed = value instanceof Date ? value : new Date((value as any) ?? Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getPresetDirection(preset: TelescopePreset, date: Date): Cesium.Cartesian3 {
  const projection = projectTelescopeTargetToEarth(preset.raHours, preset.decDegrees, date);
  const lonRad = Cesium.Math.toRadians(projection.longitudeDegrees);
  const latRad = Cesium.Math.toRadians(projection.latitudeDegrees);
  const raw = new Cesium.Cartesian3(
    Math.cos(latRad) * Math.cos(lonRad),
    Math.cos(latRad) * Math.sin(lonRad),
    Math.sin(latRad)
  );
  return Cesium.Cartesian3.normalize(raw, raw);
}

function getEarthProjectionPosition(preset: TelescopePreset, date: Date, radius = TARGET_SHELL_RADIUS_METERS): Cesium.Cartesian3 {
  return Cesium.Cartesian3.multiplyByScalar(
    getPresetDirection(preset, date),
    radius,
    new Cesium.Cartesian3()
  );
}

function getEarthFacingOrientation(cameraPosition: Cesium.Cartesian3) {
  const direction = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.negate(cameraPosition, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  const worldUp = Math.abs(Cesium.Cartesian3.dot(direction, Cesium.Cartesian3.UNIT_Z)) > 0.92
    ? Cesium.Cartesian3.UNIT_Y
    : Cesium.Cartesian3.UNIT_Z;
  const right = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.cross(direction, worldUp, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  const up = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  return { direction, up };
}

export function useTelescopePresets(viewer: Cesium.Viewer | null) {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const telescopeTarget = useUIStore((s) => s.telescopeTarget);
  const spaceInteractionTarget = useUIStore((s) => s.spaceInteractionTarget);
  const hoveredEntityId = useStore((s) => s.hoveredEntity?.id ?? null);
  const currentTime = useStore((s) => s.currentTime);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    // Active in spatial modes to show WWT targets as Earth-relative projection points.
    const active = interactionMode === 'orbital' || interactionMode === 'telescope';
    const entities: Cesium.Entity[] = [];

    if (active) {
      try {
        const projectionDate = parseProjectionDate(currentTime);
        TELESCOPE_PRESETS.forEach((preset) => {
          if (!viewer || viewer.isDestroyed()) return;

          try {
            const isSelected = telescopeTarget?.name === preset.name;
            const position = getEarthProjectionPosition(
              preset,
              projectionDate,
              isSelected ? TARGET_SHELL_RADIUS_METERS + 450_000 : TARGET_SHELL_RADIUS_METERS
            );

            // Add Earth-relative celestial target projection entity.
            const targetEntity = viewer.entities.add({
              id: `telescope-preset-${preset.id}`,
              name: preset.name,
              position: position,
              point: {
                pixelSize: isSelected ? 11 : 5,
                color: Cesium.Color.fromCssColorString(preset.color),
                outlineColor: Cesium.Color.WHITE.withAlpha(0.9),
                outlineWidth: 1.5,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
              label: {
                text: preset.name,
                font: isSelected ? 'bold 8.5pt JetBrains Mono, monospace' : '7.5pt JetBrains Mono, monospace',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.fromCssColorString(preset.color),
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2.0,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -12),
                showBackground: true,
                backgroundColor: Cesium.Color.fromCssColorString('rgba(10, 11, 16, 0.85)'),
                backgroundPadding: new Cesium.Cartesian2(8, 4),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                show: isSelected,
              },
            });
            entities.push(targetEntity);

            // Highlight surface anchor, projection path, and target shell marker for the selected target.
            if (isSelected) {
              const surfaceAnchor = Cesium.Cartesian3.multiplyByScalar(
                getPresetDirection(preset, projectionDate),
                EARTH_ANCHOR_RADIUS_METERS,
                new Cesium.Cartesian3()
              );
              const anchorEntity = viewer.entities.add({
                id: `telescope-earth-anchor-${preset.id}`,
                name: `${preset.name} Earth projection anchor`,
                position: surfaceAnchor,
                point: {
                  pixelSize: 8,
                  color: Cesium.Color.fromCssColorString(preset.color).withAlpha(0.95),
                  outlineColor: Cesium.Color.WHITE.withAlpha(0.85),
                  outlineWidth: 1.5,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                label: {
                  text: 'Earth projection anchor',
                  font: 'bold 7.5pt JetBrains Mono, monospace',
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  fillColor: Cesium.Color.WHITE.withAlpha(0.88),
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2.0,
                  verticalOrigin: Cesium.VerticalOrigin.TOP,
                  pixelOffset: new Cesium.Cartesian2(0, 12),
                  showBackground: true,
                  backgroundColor: Cesium.Color.fromCssColorString('rgba(10, 11, 16, 0.82)'),
                  backgroundPadding: new Cesium.Cartesian2(7, 4),
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
              });
              const bearingLine = viewer.entities.add({
                id: `telescope-bearing-${preset.id}`,
                name: `${preset.name} Earth projection path`,
                polyline: {
                  positions: [surfaceAnchor, position],
                  width: 2,
                  material: new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.fromCssColorString(preset.color).withAlpha(0.74),
                    dashLength: 14,
                  }),
                  arcType: Cesium.ArcType.NONE,
                },
              });
              const anchorRingEntity = viewer.entities.add({
                id: `telescope-earth-anchor-ring-${preset.id}`,
                position: surfaceAnchor,
                billboard: {
                  image: createAnchorSvg(preset.color),
                  width: 30,
                  height: 30,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
              });
              const ringEntity = viewer.entities.add({
                id: `telescope-bearing-ring-${preset.id}`,
                position: position,
                billboard: {
                  image: createRingSvg(preset.color),
                  width: 38,
                  height: 38,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
              });
              entities.push(anchorEntity);
              entities.push(bearingLine);
              entities.push(anchorRingEntity);
              entities.push(ringEntity);
            }
          } catch (presetErr) {
            console.warn(`[useTelescopePresets] Failed to create entity for ${preset.name}:`, presetErr);
          }
        });

        viewer.scene.requestRender();
      } catch (err) {
        console.warn('[useTelescopePresets] Error creating celestial entities:', err);
        useUIStore.getState().addChangeLog('TELESCOPE', `Failed to render celestial targets: ${(err as Error).message}`, 'error');
      }
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        try {
          entities.forEach((e) => {
            viewer.entities.remove(e);
          });
          viewer.scene.requestRender();
        } catch (err) {
          console.warn('[useTelescopePresets] Error cleaning up entities:', err);
        }
      }
    };
  }, [viewer, interactionMode, telescopeTarget, currentTime]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    if (interactionMode !== 'orbital') return;

    try {
      TELESCOPE_PRESETS.forEach((preset) => {
        const entity = viewer.entities.getById(`telescope-preset-${preset.id}`);
        if (entity && entity.label) {
          const isSelected = telescopeTarget?.name === preset.name;
          entity.label.show = new Cesium.ConstantProperty(isSelected || hoveredEntityId === `telescope-preset-${preset.id}`);
        }
      });
      viewer.scene.requestRender();
    } catch (err) {
      console.warn('[useTelescopePresets] Error updating hover labels:', err);
    }
  }, [viewer, interactionMode, hoveredEntityId, telescopeTarget]);

// Helpers outside the hook to perform direct mutations on Cesium.Viewer without triggering React Compiler parameter mutation warnings
function applyTelescopeGlobeMode(viewer: Cesium.Viewer, telescopeTarget: any, currentTime: unknown) {
  viewer.scene.globe.show = true;
  if (viewer.scene.globe.translucency) {
    viewer.scene.globe.translucency.enabled = true;
    viewer.scene.globe.translucency.frontFaceAlpha = 0.88;
    viewer.scene.globe.translucency.backFaceAlpha = 0.25;
  }
  viewer.scene.skyAtmosphere.show = true;

  const preset = TELESCOPE_PRESETS.find((p) => p.name === telescopeTarget?.name) || TELESCOPE_PRESETS[0];

  if (preset) {
    const projectionDate = parseProjectionDate(currentTime);
    const cameraPosition = Cesium.Cartesian3.multiplyByScalar(
      getPresetDirection(preset, projectionDate),
      CAMERA_STANDOFF_METERS,
      new Cesium.Cartesian3()
    );
    const orientation = getEarthFacingOrientation(cameraPosition);

    viewer.trackedEntity = undefined;

    viewer.camera.flyTo({
      destination: cameraPosition,
      orientation,
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.QUINTIC_IN_OUT,
      complete: () => viewer.scene.requestRender(),
    });
  } else {
    viewer.trackedEntity = undefined;
    const cameraPosition = new Cesium.Cartesian3(0, -CAMERA_STANDOFF_METERS, CAMERA_STANDOFF_METERS * 0.32);
    viewer.camera.flyTo({
      destination: cameraPosition,
      orientation: getEarthFacingOrientation(cameraPosition),
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.QUINTIC_IN_OUT,
      complete: () => viewer.scene.requestRender(),
    });
  }
}

function restoreTelescopeGlobeMode(viewer: Cesium.Viewer) {
  viewer.scene.globe.show = true;
  if (viewer.scene.globe.translucency) {
    viewer.scene.globe.translucency.enabled = false;
  }
  viewer.scene.skyAtmosphere.show = true;
}

  // Handle Camera flights & Earth globe show/hide state transitions
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    try {
      if (interactionMode === 'telescope' || spaceInteractionTarget === 'telescope') {
        applyTelescopeGlobeMode(viewer, telescopeTarget, currentTime);
      } else {
        restoreTelescopeGlobeMode(viewer);
      }
    } catch (err) {
      console.warn('[useTelescopePresets] Error during mode transition:', err);
      useUIStore.getState().addChangeLog('TELESCOPE', `Mode transition error: ${(err as Error).message}`, 'error');
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        try {
          restoreTelescopeGlobeMode(viewer);
        } catch (err) {
          console.warn('[useTelescopePresets] Error restoring globe state:', err);
        }
      }
    };
  }, [viewer, interactionMode, spaceInteractionTarget, telescopeTarget, currentTime]);
}

/** Generate a dynamic SVG target ring data URI */
function createRingSvg(color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4,4" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="${color}" stroke-width="1.5" />
      <path d="M 32 0 L 32 10 M 32 54 L 32 64 M 0 32 L 10 32 M 54 32 L 64 32" stroke="${color}" stroke-width="2" />
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

/** Generate a dynamic SVG surface anchor data URI */
function createAnchorSvg(color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="15" fill="none" stroke="${color}" stroke-width="2" stroke-opacity="0.85" />
      <circle cx="24" cy="24" r="5" fill="${color}" fill-opacity="0.85" />
      <path d="M 24 4 L 24 13 M 24 35 L 24 44 M 4 24 L 13 24 M 35 24 L 44 24" stroke="${color}" stroke-width="1.75" stroke-linecap="round" />
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}
