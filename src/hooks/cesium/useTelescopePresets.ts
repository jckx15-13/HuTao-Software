import { useEffect } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';

interface TelescopePresetConfig {
  name: string;
  raHours: number;  // Right Ascension in decimal hours (0-24)
  decDegrees: number; // Declination in decimal degrees (-90 to +90)
  color: string;
  description: string;
}

const PRESETS_COORDS: TelescopePresetConfig[] = [
  {
    name: '🌌 ANDROMEDA GALAXY (M31)',
    raHours: 0.712,
    decDegrees: 41.27,
    color: '#FF00AA',
    description: 'Our nearest major galactic neighbor, located 2.5 million light-years away.',
  },
  {
    name: '🌌 ORION NEBULA (M42)',
    raHours: 5.58,
    decDegrees: -5.38,
    color: '#FF5500',
    description: 'A massive star-forming nursery located in the Orion Constellation.',
  },
  {
    name: '🌌 PILLARS OF CREATION (M16)',
    raHours: 18.314,
    decDegrees: -13.82,
    color: '#00FFCC',
    description: 'Eagle Nebula interstellar gas clouds imaged by Hubble/JWST.',
  },
  {
    name: '🌌 CRAB NEBULA (M1)',
    raHours: 5.575,
    decDegrees: 22.01,
    color: '#FFAA00',
    description: 'Supernova remnant from the stellar explosion recorded in 1054 AD.',
  },
  {
    name: '🪐 PLANET MARS',
    raHours: 9.3,
    decDegrees: 15.6,
    color: '#FF3333',
    description: 'Orthographic geological surface mapping of the Red Planet.',
  },
  {
    name: '🪐 PLANET JUPITER',
    raHours: 13.8,
    decDegrees: -8.4,
    color: '#EAA67B',
    description: 'Gas giant atmospheric bands and Jovian satellite orbit tracks.',
  },
];

export function useTelescopePresets(viewer: Cesium.Viewer | null) {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const telescopeTarget = useUIStore((s) => s.telescopeTarget);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    // Active in both orbital and telescope views to show celestial sphere outer layers
    const active = interactionMode === 'orbital' || interactionMode === 'telescope';
    const entities: Cesium.Entity[] = [];

    if (active) {
      // Outer sphere radius (114,000 km)
      const celestialRadius = 114378137;

      PRESETS_COORDS.forEach((preset) => {
        // Translate RA/Dec to radians
        const raRad = (preset.raHours * 15.0 * Math.PI) / 180.0;
        const decRad = (preset.decDegrees * Math.PI) / 180.0;

        // Spherical to J2000 Cartesian coordinate projection
        const x = celestialRadius * Math.cos(decRad) * Math.cos(raRad);
        const y = celestialRadius * Math.cos(decRad) * Math.sin(raRad);
        const z = celestialRadius * Math.sin(decRad);
        const position = new Cesium.Cartesian3(x, y, z);

        const isSelected = telescopeTarget && preset.name.toUpperCase().includes(telescopeTarget.name.toUpperCase().replace('PLANET ', ''));

        // Add celestial target entity
        const targetEntity = viewer.entities.add({
          id: `telescope-preset-${preset.name}`,
          name: preset.name,
          position: position,
          point: {
            pixelSize: isSelected ? 12 : 8,
            color: Cesium.Color.fromCssColorString(preset.color),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2.0,
            disableDepthTestDistance: Number.POSITIVE_INFINITY, // Ensure foreground visibility
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
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
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

  // Handle Camera flights & Earth globe show/hide state transitions
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    if (interactionMode === 'telescope') {
      // Hide the Earth globe to allow clear stargazing from inside out
      viewer.scene.globe.show = false;
      viewer.scene.skyAtmosphere.show = false;

      // Find targeted preset
      const currentTarget = telescopeTarget || { name: 'Deep Sky Survey' };
      const presetNameClean = currentTarget.name.toUpperCase().replace('PLANET ', '');
      const preset = PRESETS_COORDS.find(p => 
        presetNameClean.includes(p.name.toUpperCase().replace('🌌 ', '').replace('🪐 ', ''))
      );

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
