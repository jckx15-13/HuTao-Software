import {
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    defined,
    SceneMode,
    SceneTransforms,
} from "cesium";
import type { Viewer as CesiumViewer, Cartesian2 } from "cesium";
import type { GeoEntity } from "@/core/plugins/PluginTypes";
import { useStore } from "@/core/state/store";
import { useUIStore } from "@/store/uiStore";
import {
    findStackByEntityId, expandStack, collapseStack, getStacks
} from "./StackManager";

/**
 * Pick a WorldWideView entity at a screen position using the Cesium pick API.
 */
function findEntityAtPosition(viewer: CesiumViewer, position: { x: number; y: number }): GeoEntity | null {
    if (!viewer || viewer.isDestroyed()) return null;
    const picked = viewer.scene.pick(position as Cartesian2);
    if (defined(picked) && picked.id && picked.id._wwvEntity) {
        return picked.id._wwvEntity as GeoEntity;
    }
    return null;
}

/**
 * Sets up click and hover handlers on the viewer canvas.
 * Returns a cleanup function that destroys the handler and resets the cursor.
 */
export function setupInteractionHandlers(
    viewer: CesiumViewer,
    hoveredEntityIdRef: React.MutableRefObject<string | null>
): () => void {
    if (!viewer || viewer.isDestroyed() || !viewer.scene) {
        return () => { };
    }
    const {canvas} = viewer.scene;
    const handler = new ScreenSpaceEventHandler(canvas);

    /** Currently expanded stack id (only one at a time). */
    let expandedStackId: string | null = null;

    let latestMousePos = { x: 0, y: 0 };

    if (canvas && canvas.style) {
        canvas.style.cursor = "grab";
    }

    // LEFT_DOWN → set cursor to grabbing
    handler.setInputAction(
        () => {
            if (canvas && canvas.style) {
                canvas.style.cursor = "grabbing";
            }
        },
        ScreenSpaceEventType.LEFT_DOWN
    );

    // LEFT_UP → restore cursor to pointer or grab
    handler.setInputAction(
        () => {
            if (canvas && canvas.style) {
                const entity = findEntityAtPosition(viewer, latestMousePos);
                canvas.style.cursor = entity ? "pointer" : "grab";
            }
        },
        ScreenSpaceEventType.LEFT_UP
    );

    // Click → select entity or expand stack
    handler.setInputAction(
        (event: { position: { x: number; y: number } }) => {
            if (!viewer || viewer.isDestroyed()) return;
            const entity = findEntityAtPosition(viewer, event.position);

            if (entity) {
                const stack = findStackByEntityId(entity.id);
                // If clicked entity is in a stack
                if (stack && stack.children.length > 1) {
                    if (stack.state === "collapsed" || stack.state === "collapsing") {
                        // Expand the stack and select the hub
                        expandStack(stack.id);
                        if (expandedStackId && expandedStackId !== stack.id) {
                            collapseStack(expandedStackId);
                        }
                        expandedStackId = stack.id;
                        useStore.getState().setSelectedEntity(entity);
                    } else {
                        // Stack is already expanded, user clicked a leaf node -> select it
                        useStore.getState().setSelectedEntity(entity);
                    }
                } else {
                    // Clicked a standalone entity -> select it and close any open stack
                    useStore.getState().setSelectedEntity(entity);
                    if (expandedStackId) {
                        collapseStack(expandedStackId);
                        expandedStackId = null;
                    }
                }
                
                // Clear activeLocation in UI Store and open the context panel
                useUIStore.getState().setActiveLocation(null);
                useUIStore.getState().setRightPanelTab('context');
                useUIStore.getState().setRightPanelOpen(true);
            } else {
                // Clicked empty space -> clear selection and close any open stack
                useStore.getState().setSelectedEntity(null);
                if (expandedStackId) {
                    collapseStack(expandedStackId);
                    expandedStackId = null;
                }
            }

            if (entity) {
                useStore.getState().setHoveredEntity(null, null);
                hoveredEntityIdRef.current = null;
            }

            // Immediately request a render frame to apply highlight changes
            // or to kickstart the CSS spiderifier animation loop
            viewer.scene.requestRender();
        },
        ScreenSpaceEventType.LEFT_CLICK
    );

    let latestHoverRequestId = 0;
    let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
    let isDragging = false;

    // Track camera movement to avoid expensive picking during camera pan
    const onMoveStart = () => { isDragging = true; };
    const onMoveEnd = () => { isDragging = false; };
    viewer.camera.moveStart.addEventListener(onMoveStart);
    viewer.camera.moveEnd.addEventListener(onMoveEnd);

    // Hover → show tooltip card only
    handler.setInputAction(
        (event: { endPosition: { x: number; y: number } }) => {
            // Canvas-local coordinates used for Cesium picking
            const canvasPos = { x: event.endPosition.x, y: event.endPosition.y };
            latestMousePos = canvasPos;

            // Convert canvas-local coords to viewport/client coords for UI placement
            const rect = canvas.getBoundingClientRect();
            const screenPos = { x: Math.round(rect.left + canvasPos.x), y: Math.round(rect.top + canvasPos.y) };

            if (hoveredEntityIdRef.current) {
                useStore.getState().setHoveredEntity(useStore.getState().hoveredEntity, screenPos);
            }

            if (!viewer || viewer.isDestroyed()) return;
            if (viewer.scene.mode === SceneMode.MORPHING) return;

            if (isDragging) return;

            latestHoverRequestId++;
            const currentRequestId = latestHoverRequestId;

            if (hoverTimeout) clearTimeout(hoverTimeout);

            hoverTimeout = setTimeout(() => {
                if (currentRequestId !== latestHoverRequestId) return;
                if (!viewer || viewer.isDestroyed() || isDragging) return;

                // Use canvas-local coords for picking
                const entity = findEntityAtPosition(viewer, canvasPos);

                const prevId = hoveredEntityIdRef.current;
                const newId = entity ? entity.id : null;

                if (prevId !== newId) {
                    hoveredEntityIdRef.current = newId;
                    canvas.style.cursor = entity ? "pointer" : "grab";
                    useStore.getState().setHoveredEntity(entity, entity ? screenPos : null);
                    // Trigger render to apply hover highlights immediately
                    viewer.scene.requestRender();
                }
            }, 60);
        },
        ScreenSpaceEventType.MOUSE_MOVE
    );

    return () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (viewer && !viewer.isDestroyed()) {
            viewer.camera.moveStart.removeEventListener(onMoveStart);
            viewer.camera.moveEnd.removeEventListener(onMoveEnd);
        }
        if (handler && !handler.isDestroyed()) {
            handler.destroy();
        }
        if (canvas && canvas.style) {
            canvas.style.cursor = "default";
        }
    };
}
