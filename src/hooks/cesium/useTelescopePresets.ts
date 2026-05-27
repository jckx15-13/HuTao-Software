import { useEffect } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { TELESCOPE_PRESETS } from '@/data/telescopePresets';

export function useTelescopePresets(viewer: Cesium.Viewer | null) {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const telescopeTarget = useUIStore((s) => s.telescopeTarget);
  const hoveredEntityId = useStore((s) => s.hoveredEntity?.id ?? null);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    // Active in both orbital and telescope views to show celestial sphere outer layers
    const active = interactionMode === 'orbital' || interactionMode === 'telescope';
    const entities: Cesium.Entity[] = [];

    if (active) {
      // Outer sphere radius (114,000 km)
      const celestialRadius = 114378137;

      TELESCOPE_PRESETS.forEach((preset) => {
        // Translate RA/Dec to radians
        const raRad = (preset.raHours * 15.0 * Math.PI) / 180.0;
        const decRad = (preset.decDegrees * Math.PI) / 180.0;

        // Spherical to J2000 Cartesian coordinate projection
        const x = celestialRadius * Math.cos(decRad) * Math.cos(raRad);
        const y = celestialRadius * Math.cos(decRad) * Math.sin(raRad);
        const z = celestialRadius * Math.sin(decRad);
        const position = new Cesium.Cartesian3(x, y, z);

        const isSelected = telescopeTarget?.name === preset.name;

        // Add celestial target entity
        const targetEntity = viewer.entities.add({
          id: `telescope-preset-${preset.id}`,
          name: preset.name,
          position: position,
          point: {
            pixelSize: isSelected ? 10 : 6,
            color: Cesium.Color.fromCssColorString(preset.color),
            outlineColor: Cesium.Color.WHITE.withAlpha(0.9),
            outlineWidth: 1.5,
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
            show: false,
          },
        });
        entities.push(targetEntity);

        // Highlight ring overlay for selected target
        if (isSelected) {
          const ringEntity = viewer.entities.add({
            position: position,
            billboard: {
              image: createRingSvg(preset.color),
              width: 32,
              height: 32,
            },
          });
          entities.push(ringEntity);
        }
      });

      viewer.scene.requestRender();
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        entities.forEach((e) => {
          viewer.entities.remove(e);
        });
        viewer.scene.requestRender();
      }
    };
  }, [viewer, interactionMode, telescopeTarget]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    if (!(interactionMode === 'orbital' || interactionMode === 'telescope')) return;

    TELESCOPE_PRESETS.forEach((preset) => {
      const entity = viewer.entities.getById(`telescope-preset-${preset.id}`);
      if (entity && entity.label) {
        entity.label.show = new Cesium.ConstantProperty(hoveredEntityId === `telescope-preset-${preset.id}`);
      }
    });
    viewer.scene.requestRender();
  }, [viewer, interactionMode, hoveredEntityId]);

  // Handle Camera flights & Earth globe show/hide state transitions
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    if (interactionMode === 'telescope') {
      // Hide the Earth globe to allow clear stargazing from inside out
      viewer.scene.globe.show = false;
      viewer.scene.skyAtmosphere.show = false;

      // Find targeted preset
      const preset = TELESCOPE_PRESETS.find((p) => p.name === telescopeTarget?.name) || TELESCOPE_PRESETS[0];

      if (preset) {
        const raRad = (preset.raHours * 15.0 * Math.PI) / 180.0;
        const decRad = (preset.decDegrees * Math.PI) / 180.0;
        const celestialRadius = 114378137;
        const x = celestialRadius * Math.cos(decRad) * Math.cos(raRad);
        const y = celestialRadius * Math.cos(decRad) * Math.sin(raRad);
        const z = celestialRadius * Math.sin(decRad);
        const targetPos = new Cesium.Cartesian3(x, y, z);
        
        const direction = Cesium.Cartesian3.normalize(targetPos, new Cesium.Cartesian3());

        // Release any active tracking to allow manual flight
        viewer.trackedEntity = undefined;

        // Position camera exactly at Earth's center pointing outward
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.ZERO,
          orientation: {
            direction: direction,
            up: new Cesium.Cartesian3(0, 0, 1), // Align North
          },
          duration: 2.0,
          easingFunction: Cesium.EasingFunction.QUINTIC_IN_OUT,
        });
      } else {
        // Reset to default deep sky orientation looking North
        viewer.trackedEntity = undefined;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.ZERO,
          orientation: {
            direction: new Cesium.Cartesian3(0, 1, 0),
            up: new Cesium.Cartesian3(0, 0, 1),
          },
          duration: 2.0,
          easingFunction: Cesium.EasingFunction.QUINTIC_IN_OUT,
        });
      }
    } else {
      // Restore standard Earth globe and atmosphere layers
      viewer.scene.globe.show = true;
      viewer.scene.skyAtmosphere.show = true;
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.globe.show = true;
        viewer.scene.skyAtmosphere.show = true;
      }
    };
  }, [viewer, interactionMode, telescopeTarget]);
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
