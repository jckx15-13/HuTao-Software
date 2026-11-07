import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { getSpaceFocus } from '@/lib/spaceFocus';
import { useStore } from '@/core/state/store';
import { TELESCOPE_PRESETS, resolveTelescopePresetCoordinates } from '@/data/telescopePresets';
import type { TelescopePreset } from '@/data/telescopePresets';
import { projectTelescopeTargetToEarth } from '@/lib/earthObserverProjection';

const EARTH_RADIUS_METERS = 6_378_137;
const TARGET_SHELL_RADIUS_METERS = 8_600_000;
const EARTH_ANCHOR_RADIUS_METERS = EARTH_RADIUS_METERS * 1.018;
const TELESCOPE_ORBIT_HEIGHT_METERS = 30_000_000;
const ENTITY_UPDATE_MS = 500;

interface TelescopeEntityBundle {
  presetId: string;
  targetEntityId: string;
  anchorEntityId?: string;
  bearingLineId?: string;
  anchorRingId?: string;
  ringId?: string;
  isSelected: boolean;
}

function getPresetDirection(preset: TelescopePreset, date: Date): Cesium.Cartesian3 {
  const coordinates = resolveTelescopePresetCoordinates(preset, date);
  const projection = projectTelescopeTargetToEarth(coordinates.raHours, coordinates.decDegrees, date);
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

function makeTelescopeEntityBundle(
  viewer: Cesium.Viewer,
  preset: TelescopePreset,
  isSelected: boolean,
  projectionDate: Date,
): TelescopeEntityBundle {
  const position = getEarthProjectionPosition(
    preset,
    projectionDate,
    isSelected ? TARGET_SHELL_RADIUS_METERS + 450_000 : TARGET_SHELL_RADIUS_METERS
  );

  const targetEntity = viewer.entities.add({
    id: `telescope-preset-${preset.id}`,
    name: preset.name,
    position: new Cesium.ConstantPositionProperty(position),
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
      show: new Cesium.ConstantProperty(isSelected),
    },
  });

  const bundle: TelescopeEntityBundle = {
    presetId: preset.id,
    targetEntityId: targetEntity.id,
    isSelected,
  };

  if (!isSelected) {
    return bundle;
  }

  const surfaceAnchor = Cesium.Cartesian3.multiplyByScalar(
    getPresetDirection(preset, projectionDate),
    EARTH_ANCHOR_RADIUS_METERS,
    new Cesium.Cartesian3()
  );

  const anchorEntity = viewer.entities.add({
    id: `telescope-earth-anchor-${preset.id}`,
    name: `${preset.name} Earth projection anchor`,
    position: new Cesium.ConstantPositionProperty(surfaceAnchor),
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
      positions: new Cesium.ConstantProperty([surfaceAnchor, position]),
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
    position: new Cesium.ConstantPositionProperty(surfaceAnchor),
    billboard: {
      image: createAnchorSvg(preset.color),
      width: 30,
      height: 30,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  const ringEntity = viewer.entities.add({
    id: `telescope-bearing-ring-${preset.id}`,
    position: new Cesium.ConstantPositionProperty(position),
    billboard: {
      image: createRingSvg(preset.color),
      width: 38,
      height: 38,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  bundle.anchorEntityId = anchorEntity.id;
  bundle.bearingLineId = bearingLine.id;
  bundle.anchorRingId = anchorRingEntity.id;
  bundle.ringId = ringEntity.id;

  return bundle;
}

function removeBundleEntities(viewer: Cesium.Viewer, bundle: TelescopeEntityBundle): void {
  viewer.entities.removeById(bundle.targetEntityId);
  if (bundle.anchorEntityId) viewer.entities.removeById(bundle.anchorEntityId);
  if (bundle.bearingLineId) viewer.entities.removeById(bundle.bearingLineId);
  if (bundle.anchorRingId) viewer.entities.removeById(bundle.anchorRingId);
  if (bundle.ringId) viewer.entities.removeById(bundle.ringId);
}

function moveToTelescopeOrbit(viewer: Cesium.Viewer) {
  const { camera, scene, trackedEntity } = viewer;
  const orbitalView = {
    destination: camera.positionWC.clone(),
    orientation: { direction: camera.directionWC.clone(), up: camera.upWC.clone() },
    endTransform: camera.transform.clone(),
  };
  const orbit = camera.positionCartographic.clone();
  orbit.height = TELESCOPE_ORBIT_HEIGHT_METERS;
  const destination = scene.globe.ellipsoid.cartographicToCartesian(orbit);

  viewer.trackedEntity = undefined;
  camera.flyTo({
    destination,
    orientation: getEarthFacingOrientation(destination),
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.6,
    easingFunction: Cesium.EasingFunction.QUINTIC_IN_OUT,
  });

  return () => {
    if (viewer.isDestroyed()) return;
    camera.cancelFlight();
    camera.setView(orbitalView);
    viewer.trackedEntity = trackedEntity;
    scene.requestRender();
  };
}

export function useTelescopePresets(viewer: Cesium.Viewer | null) {
  const spaceFocus = useUIStore((s) => getSpaceFocus(s.interactionMode, s.spaceInteractionTarget));
  const telescopeTarget = useUIStore((s) => s.telescopeTarget);
  const hoveredEntityId = useStore((s) => s.hoveredEntity?.id ?? null);
  const telescopeFocused = spaceFocus === 'telescope';
  const showOrbitalProjections = spaceFocus === 'earth';
  const bundleMap = useRef<Map<string, TelescopeEntityBundle>>(new Map());

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !showOrbitalProjections) return;

    const projectionDate = new Date();
    const next = new Map<string, TelescopeEntityBundle>();

    try {
      for (const preset of TELESCOPE_PRESETS) {
        const isSelected = telescopeTarget?.name === preset.name;
        const bundle = makeTelescopeEntityBundle(viewer, preset, isSelected, projectionDate);
        next.set(preset.id, bundle);
      }

      bundleMap.current.forEach((existingBundle, presetId) => {
        if (!next.has(presetId)) {
          removeBundleEntities(viewer, existingBundle);
        }
      });

      bundleMap.current = next;
      viewer.scene.requestRender();
    } catch (err) {
      console.warn('[useTelescopePresets] Error creating celestial entities:', err);
      useUIStore.getState().addChangeLog('TELESCOPE', `Failed to render celestial targets: ${(err as Error).message}`, 'error');
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        bundleMap.current.forEach((bundle) => removeBundleEntities(viewer, bundle));
        bundleMap.current.clear();
      }
    };
  }, [viewer, showOrbitalProjections, telescopeTarget?.name]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    if (!showOrbitalProjections) return;

    let active = true;
    const update = () => {
      if (!active || !viewer || viewer.isDestroyed()) return;
      const projectionDate = new Date();

      for (const preset of TELESCOPE_PRESETS) {
        const bundle = bundleMap.current.get(preset.id);
        if (!bundle) continue;
        const isSelected = bundle.isSelected;

        const targetPosition = getEarthProjectionPosition(
          preset,
          projectionDate,
          isSelected ? TARGET_SHELL_RADIUS_METERS + 450_000 : TARGET_SHELL_RADIUS_METERS
        );

        const target = viewer.entities.getById(bundle.targetEntityId);
        if (target) {
          target.position = new Cesium.ConstantPositionProperty(targetPosition);
          if (target.point) target.point.pixelSize = new Cesium.ConstantProperty(isSelected ? 11 : 5);
          if (target.label) {
            target.label.font = new Cesium.ConstantProperty(
              isSelected
                ? 'bold 8.5pt JetBrains Mono, monospace'
                : '7.5pt JetBrains Mono, monospace',
            );
            target.label.show = new Cesium.ConstantProperty(isSelected);
          }
        }

        if (!isSelected) continue;

        const surfaceAnchor = Cesium.Cartesian3.multiplyByScalar(
          getPresetDirection(preset, projectionDate),
          EARTH_ANCHOR_RADIUS_METERS,
          new Cesium.Cartesian3()
        );

        const anchor = bundle.anchorEntityId ? viewer.entities.getById(bundle.anchorEntityId) : null;
        if (anchor) anchor.position = new Cesium.ConstantPositionProperty(surfaceAnchor);

        const anchorRing = bundle.anchorRingId ? viewer.entities.getById(bundle.anchorRingId) : null;
        if (anchorRing) anchorRing.position = new Cesium.ConstantPositionProperty(surfaceAnchor);

        const ring = bundle.ringId ? viewer.entities.getById(bundle.ringId) : null;
        if (ring) ring.position = new Cesium.ConstantPositionProperty(targetPosition);

        const line = bundle.bearingLineId ? viewer.entities.getById(bundle.bearingLineId) : null;
        if (line?.polyline) {
          line.polyline.positions = new Cesium.ConstantProperty([surfaceAnchor, targetPosition]);
        }
      }

      viewer.scene.requestRender();
    };

    const timer = window.setInterval(() => {
      update();
    }, ENTITY_UPDATE_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [viewer, showOrbitalProjections]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    if (!showOrbitalProjections) return;

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
  }, [viewer, showOrbitalProjections, hoveredEntityId, telescopeTarget]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !telescopeFocused) return;
    return moveToTelescopeOrbit(viewer);
  }, [viewer, telescopeFocused]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const selectedName = telescopeTarget?.name;
    bundleMap.current.forEach((bundle) => {
      bundle.isSelected = selectedName === TELESCOPE_PRESETS.find((preset) => preset.id === bundle.presetId)?.name;
    });
  }, [viewer, telescopeTarget?.name]);
}
