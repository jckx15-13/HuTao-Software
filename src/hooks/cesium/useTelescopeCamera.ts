import { useEffect } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { useObservatory } from '@/core/state/observatoryStore';
import { getCesiumViewer } from '@/lib/cesiumViewerRegistry';

/** Telescope changes the existing world's camera, never creates another viewer. */
export function useTelescopeCamera(viewer: Cesium.Viewer | null) {
  const active = useUIStore((s) => s.interactionMode === 'telescope' || s.spaceInteractionTarget === 'telescope');
  const navigation = useObservatory((s) => s.navigation);
  const utc = useObservatory((s) => s.utc);

  useEffect(() => {
    const sceneViewer = getCesiumViewer();
    if (!sceneViewer || sceneViewer.isDestroyed() || !active) return;
    const viewer = sceneViewer;
    const camera = viewer.camera;
    const controller = viewer.scene.screenSpaceCameraController;
    camera.cancelFlight();
    const saved = {
      position: camera.positionWC.clone(), direction: camera.directionWC.clone(), up: camera.upWC.clone(),
      transform: camera.transform.clone(), constrainedAxis: camera.constrainedAxis?.clone(),
      frustum: camera.frustum.clone(), trackedEntity: viewer.trackedEntity,
      time: viewer.clock.currentTime.clone(), animate: viewer.clock.shouldAnimate,
      lookEventTypes: controller.lookEventTypes,
      enableRotate: controller.enableRotate, enableTranslate: controller.enableTranslate,
      enableZoom: controller.enableZoom, enableTilt: controller.enableTilt, enableLook: controller.enableLook,
    };
    viewer.trackedEntity = undefined;
    useObservatory.getState().set({ navigation: 'look' });
    camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    camera.constrainedAxis = undefined;
    controller.enableRotate = false;
    controller.enableTranslate = false;
    controller.enableTilt = false;
    controller.enableZoom = false;
    controller.enableLook = true;
    controller.lookEventTypes = Cesium.CameraEventType.LEFT_DRAG;
    const cartographic = camera.positionCartographic;
    camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, Math.max(cartographic.height * 1.8, 24_000_000)),
      orientation: { direction: saved.direction, up: saved.up },
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.25,
    });
    const wheel = (event: WheelEvent) => {
      if (useObservatory.getState().navigation !== 'look') return;
      event.preventDefault();
      if (camera.frustum instanceof Cesium.PerspectiveFrustum) {
        camera.frustum.fov = Cesium.Math.clamp((camera.frustum.fov ?? Math.PI / 3) * Math.exp(event.deltaY * 0.001), Cesium.Math.toRadians(0.05), Cesium.Math.toRadians(100));
        viewer.scene.requestRender();
      }
    };
    viewer.canvas.addEventListener('wheel', wheel, { passive: false });
    return () => {
      viewer.canvas.removeEventListener('wheel', wheel);
      if (viewer.isDestroyed()) return;
      camera.cancelFlight();
      camera.frustum = saved.frustum;
      viewer.clock.currentTime = saved.time;
      viewer.clock.shouldAnimate = saved.animate;
      camera.constrainedAxis = saved.constrainedAxis;
      controller.lookEventTypes = saved.lookEventTypes;
      controller.enableRotate = saved.enableRotate;
      controller.enableTranslate = saved.enableTranslate;
      controller.enableZoom = saved.enableZoom;
      controller.enableTilt = saved.enableTilt;
      controller.enableLook = saved.enableLook;
      camera.setView({ destination: saved.position, orientation: { direction: saved.direction, up: saved.up }, endTransform: saved.transform });
      viewer.trackedEntity = saved.trackedEntity;
      viewer.scene.requestRender();
    };
  }, [viewer, active]);

  useEffect(() => {
    const sceneViewer = getCesiumViewer();
    if (!sceneViewer || sceneViewer.isDestroyed() || !active) return;
    const viewer = sceneViewer;
    const controls = viewer.scene.screenSpaceCameraController;
    controls.enableRotate = navigation === 'orbit';
    controls.enableTilt = navigation === 'orbit';
    controls.enableZoom = navigation === 'orbit';
    controls.enableLook = navigation === 'look';
  }, [viewer, active, navigation]);

  useEffect(() => {
    const sceneViewer = getCesiumViewer();
    if (!sceneViewer || sceneViewer.isDestroyed() || !active) return;
    const viewer = sceneViewer;
    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(utc);
    viewer.clock.shouldAnimate = false;
    viewer.scene.requestRender();
  }, [viewer, active, utc]);
}
