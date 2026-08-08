import { useEffect, useState } from 'react';
import * as Cesium from 'cesium';
import { useConfig } from '../../context/ConfigContext';
import { useUIStore } from '../../store/uiStore';

const isLowEndHardware = () => {
  if (typeof navigator === 'undefined') return false;
  const deviceMemory = (navigator as any).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return deviceMemory <= 4 || cores <= 4 || mobile;
};

export type CesiumViewerStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Cesium viewer hook with WWV-inspired performance optimizations.
 *
 * Key techniques adopted from WorldWideView:
 * - requestRenderMode + maximumRenderTimeChange (render only when needed)
 * - WebGL2 context with anti-aliasing
 * - Configurable resolutionScale for low-power devices
 * - MSAA control with Firefox detection
 * - depthTestAgainstTerrain for proper occlusion
 * - Screen-space camera controller tweaks
 */
export function useCesiumViewer(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config, isLoading: configLoading } = useConfig();

  // WebGL availability check derived lazily
  const [webglError] = useState<string | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      if (/HeadlessChrome/i.test(navigator.userAgent) || window.location.search.includes('fallback')) {
        return 'WebGL disabled in headless browser environment';
      }
      const canvas = document.createElement('canvas');
      if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) {
        return 'WebGL context creation failed';
      }
      return null;
    } catch (err: any) {
      return err?.message ?? String(err);
    }
  });

  useEffect(() => {
    if (webglError) return;
    if (!containerRef.current || configLoading || !config) return;

    let activeViewer: Cesium.Viewer | null = null;
    let active = true;
    const lowEndDevice = isLowEndHardware();
    let canvas: HTMLCanvasElement | null = null;
    let pointerHandler: (() => void) | null = null;
    let requestRender: (() => void) | null = null;

    if (config.CESIUM_ION_ACCESS_TOKEN) {
      Cesium.Ion.defaultAccessToken = config.CESIUM_ION_ACCESS_TOKEN;
    }

    try {
      // Firefox detection for MSAA workaround (from WWV)
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

      activeViewer = new Cesium.Viewer(containerRef.current, {
        // Disable all default UI widgets — we render our own
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,

        // Performance: 3D-only mode eliminates 2D/Columbus overhead
        scene3DOnly: true,

        // WWV key optimization: Only render when the scene actually changes.
        // maximumRenderTimeChange=0.5 means "re-render if 0.5s have passed since
        // last render OR if scene.requestRender() was called". Far better than
        // Infinity (missed clock updates) or 0 (continuous rendering).
        requestRenderMode: true,
        maximumRenderTimeChange: 0.5,

        // WWV pattern: Request WebGL2 for better performance + built-in AA
        contextOptions: { webgl: { antialias: true } },

        // MSAA: 1 sample on Firefox (buggy), 2x elsewhere for quality/perf balance
        msaaSamples: isFirefox || lowEndDevice ? 1 : 2,

        // Hide Cesium credits in a detached element
        creditContainer: document.createElement('div'),

        // useImageryManager owns all imagery. Starting with no implicit base
        // layer avoids duplicate tile requests and startup layer flicker.
        baseLayer: false
      });

      (window as any).cesiumViewer = activeViewer;
    } catch (err: any) {
      if (!active) return;
      const msg = err?.message ?? String(err);
      setTimeout(() => {
        setError(msg);
        setIsLoaded(true);
      }, 0);
      return;
    }

    const viewerInstance = activeViewer;

    // --- Performance tuning (WWV patterns) ---

    // Resolution scale: lower quality on low-end devices to reduce GPU load
    viewerInstance.resolutionScale = lowEndDevice ? 0.5 : 0.75;

    // Globe polygon detail: coarser on low-end devices
    viewerInstance.scene.globe.maximumScreenSpaceError = lowEndDevice ? 6.0 : 3.0;

    // Disable expensive FXAA post-process (we use MSAA instead)
    if (viewerInstance.scene.postProcessStages.fxaa) {
      viewerInstance.scene.postProcessStages.fxaa.enabled = false;
    }

    // --- Visual quality (Anime Sci-Fi Space Opera / WWT Aesthetics) ---
    viewerInstance.scene.globe.enableLighting = !lowEndDevice; // Disable expensive globe lighting on weaker hardware
    viewerInstance.scene.globe.showWaterEffect = false;
    viewerInstance.scene.globe.baseColor = Cesium.Color.fromCssColorString('#08101d');
    if ((viewerInstance.scene.globe as any).showGroundAtmosphere !== undefined) {
      (viewerInstance.scene.globe as any).showGroundAtmosphere = !lowEndDevice;
    }
    viewerInstance.scene.globe.depthTestAgainstTerrain = true; // Proper occlusion
    viewerInstance.scene.backgroundColor = Cesium.Color.fromCssColorString('#020205'); // Space opera dark background
    viewerInstance.scene.highDynamicRange = !lowEndDevice; // Disable HDR on low-end devices

    // Cool-toned luminous space atmosphere
    const skyAtmosphere = viewerInstance.scene.skyAtmosphere;
    if (skyAtmosphere) {
      skyAtmosphere.show = !lowEndDevice;
      if (!lowEndDevice) {
        skyAtmosphere.brightnessShift = 0.15; // Enhanced brightness contrast
        skyAtmosphere.saturationShift = 0.45; // Luminous saturation
        skyAtmosphere.hueShift = -0.05; // Cool cyan/purple shift
      }
    }

    // Configure globe atmospheric lighting
    viewerInstance.scene.globe.atmosphereBrightnessShift = 0.15;
    viewerInstance.scene.globe.atmosphereSaturationShift = 0.45;
    viewerInstance.scene.globe.atmosphereHueShift = -0.05;
    viewerInstance.scene.globe.lightingFadeOutDistance = 1e7;
    viewerInstance.scene.globe.lightingFadeInDistance = 2e7;

    // --- Camera controller improvements (from WWV) ---
    const sscc = viewerInstance.scene.screenSpaceCameraController;
    // Intuitive mapping: left-drag = rotate/orbit, right-drag = translate/pan, pinch = zoom/tilt
    // Keep a ctrl+left modifier available for tilt when desired.
    sscc.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG, Cesium.CameraEventType.PINCH];
    sscc.translateEventTypes = [Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.MIDDLE_DRAG];
    sscc.tiltEventTypes = [
      Cesium.CameraEventType.RIGHT_DRAG,
      Cesium.CameraEventType.PINCH,
      { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL }
    ];

    // Camera sensitivity tuning (user-controlled via UI store)
    try {
      const sensitivity =
        typeof useUIStore?.getState === 'function' ? (useUIStore.getState().cameraSensitivity ?? 1.0) : 1.0;
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

      // Higher sensitivity => faster response, less inertia, stronger zoom
      sscc.inertiaSpin = clamp(0.9 - (sensitivity - 1) * 0.12, 0.2, 0.95);
      sscc.inertiaTranslate = clamp(0.9 - (sensitivity - 1) * 0.12, 0.2, 0.95);
      sscc.inertiaZoom = clamp(0.8 - (sensitivity - 1) * 0.1, 0.15, 0.95);
      sscc.zoomFactor = 5 * Math.max(0.25, sensitivity);
      sscc.maximumMovementRatio = clamp(0.1 * (1 + (sensitivity - 1) * 0.5), 0.05, 0.5);
    } catch (e) {
      // Ignore if store is unavailable in some test contexts
    }

    // Ensure pointer interactions request a render when using requestRenderMode
    canvas = viewerInstance.scene.canvas as HTMLCanvasElement;
    requestRender = () => {
      try {
        viewerInstance.scene.requestRender();
      } catch (err) {
        /* ignore */
      }
    };
    pointerHandler = () => {
      if (requestRender) requestRender();
    };
    canvas.addEventListener('pointerdown', pointerHandler);
    canvas.addEventListener('pointerup', pointerHandler);
    canvas.addEventListener('pointermove', pointerHandler);
    canvas.addEventListener('wheel', pointerHandler, { passive: true } as AddEventListenerOptions);
    const camera = viewerInstance.camera as Cesium.Camera & { changed: Cesium.Event };
    if (camera.changed?.addEventListener) {
      try {
        camera.changed.addEventListener(requestRender);
      } catch (e) {}
    }

      // Start at a global-Earth distance so imagery and orbital tracks are
      // visible on launch instead of occupying a few pixels against the sky.
    viewerInstance.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 20, 20_000_000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
    });
    if (active && !viewerInstance.isDestroyed()) {
      setViewer(viewerInstance);
      setIsLoaded(true);
      viewerInstance.scene.requestRender();
    }

    return () => {
      active = false;
      try {
        // remove pointer listeners if canvas still exists
        if (canvas && pointerHandler) {
          canvas.removeEventListener('pointerdown', pointerHandler);
          canvas.removeEventListener('pointerup', pointerHandler);
          canvas.removeEventListener('pointermove', pointerHandler);
          canvas.removeEventListener('wheel', pointerHandler as EventListenerOrEventListenerObject);
        }
        const camera = viewerInstance?.camera as Cesium.Camera & { changed: Cesium.Event };
        if (camera?.changed?.removeEventListener && requestRender) {
          try {
            camera.changed.removeEventListener(requestRender);
          } catch (e) {}
        }
      } catch (e) {}

      if (!viewerInstance.isDestroyed()) {
        viewerInstance.destroy();
        (window as any).cesiumViewer = null;
      }
      setViewer(null);
      setIsLoaded(false);
    };
  }, [containerRef, config, configLoading, webglError]);

  const status: CesiumViewerStatus = webglError
    ? 'error'
    : error
    ? 'error'
    : isLoaded && viewer
    ? 'ready'
    : containerRef.current && !configLoading
    ? 'loading'
    : 'idle';

  return {
    viewer,
    status,
    isLoaded: webglError ? true : isLoaded,
    error: webglError || error
  };
}
