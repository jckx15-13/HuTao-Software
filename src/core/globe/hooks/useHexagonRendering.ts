import { useEffect, useRef } from "react";
import { Cartesian3, Color, Entity as CesiumEntity } from "cesium";
import type { Viewer as CesiumViewer } from "cesium";
import type { GeoEntity, CesiumEntityOptions } from "@/core/plugins/PluginTypes";

/**
 * Renders glowing 3D hexagons (cylinders with 6 slices) for seismic events
 * or other data points configured with options.type === "hexagon".
 */
export function useHexagonRendering(
    viewer: CesiumViewer | null,
    isReady: boolean,
    hexagonEntities: Array<{ entity: GeoEntity; options: CesiumEntityOptions }>
) {
    const activeHexagonsRef = useRef<Map<string, CesiumEntity>>(new Map());

    useEffect(() => {
        if (!viewer || !isReady || viewer.isDestroyed()) return;

        const activeHexagons = activeHexagonsRef.current;
        const currentIds = new Set<string>();

        for (const { entity, options } of hexagonEntities) {
            const id = entity.id;
            currentIds.add(id);

            const mag = (entity.properties.mag as number) || 1.0;
            const height = mag * 80000; // 80km per magnitude
            const radius = mag * 16000;  // 16km per magnitude
            const colorStr = options.color || "#ff8800";
            const color = Color.fromCssColorString(colorStr).withAlpha(0.65);
            const outlineColor = Color.WHITE.withAlpha(0.85);

            // Center of cylinder is height / 2 above ground
            const position = Cartesian3.fromDegrees(entity.longitude, entity.latitude, height / 2);

            const existing = activeHexagons.get(id);
            if (existing) {
                // Update existing entity
                existing.position = position as any;
                if (existing.cylinder) {
                    existing.cylinder.length = height as any;
                    existing.cylinder.topRadius = radius as any;
                    existing.cylinder.bottomRadius = radius as any;
                    existing.cylinder.material = color as any;
                }
                continue;
            }

            // Create new entity
            const hexagonEntity = viewer.entities.add({
                id: `hexagon-${id}`,
                position: position,
                cylinder: {
                    length: height,
                    topRadius: radius,
                    bottomRadius: radius,
                    slices: 6, // 6 slices = Hexagon
                    material: color,
                    outline: true,
                    outlineColor: outlineColor,
                    outlineWidth: 1.5,
                },
                label: options.labelText ? {
                    text: options.labelText,
                    font: options.labelFont || "10px monospace",
                    fillColor: Color.WHITE,
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                    pixelOffset: { x: 0, y: -20 } as any,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                } : undefined,
            });

            activeHexagons.set(id, hexagonEntity);
        }

        // Cleanup removed hexagons
        for (const [id, entity] of activeHexagons.entries()) {
            if (!currentIds.has(id)) {
                if (!viewer.isDestroyed()) {
                    viewer.entities.remove(entity);
                }
                activeHexagons.delete(id);
            }
        }

        viewer.scene.requestRender();

        return () => {
            if (!viewer.isDestroyed()) {
                for (const entity of activeHexagons.values()) {
                    viewer.entities.remove(entity);
                }
            }
            activeHexagons.clear();
        };
    }, [viewer, isReady, hexagonEntities]);
}
