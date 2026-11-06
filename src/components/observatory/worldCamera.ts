import * as Cesium from 'cesium';
import { getCesiumViewer } from '@/lib/cesiumViewerRegistry';
import { useObservatory } from '@/core/state/observatoryStore';

export function lookAround(direction?: Cesium.Cartesian3) {
  const viewer = getCesiumViewer();
  if (!viewer) return;
  viewer.camera.cancelFlight();
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  useObservatory.getState().set({ navigation: 'look' });
  if (direction) {
    const forward = Cesium.Cartesian3.normalize(direction, new Cesium.Cartesian3());
    const reference = Math.abs(forward.z) > 0.95 ? Cesium.Cartesian3.UNIT_Y : Cesium.Cartesian3.UNIT_Z;
    const right = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(forward, reference, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    viewer.camera.setView({ orientation: { direction: forward, up: Cesium.Cartesian3.cross(right, forward, new Cesium.Cartesian3()) } });
  }
  viewer.scene.requestRender();
}

export function orbitBody(position: Cesium.Cartesian3, radius: number) {
  const viewer = getCesiumViewer();
  if (!viewer) return;
  viewer.camera.cancelFlight();
  if (viewer.camera.frustum instanceof Cesium.PerspectiveFrustum) viewer.camera.frustum.fov = Cesium.Math.toRadians(55);
  viewer.camera.lookAt(position, new Cesium.HeadingPitchRange(0, -0.3, radius * 4));
  useObservatory.getState().set({ navigation: 'orbit' });
  viewer.scene.requestRender();
}
