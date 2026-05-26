import { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import { setupImagery } from '../../lib/imageryFactory';
import { loadConfig } from '../../lib/config';
import { useUIStore } from '../../store/uiStore';

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
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable error setter for child components
  const onError = useCallback((msg: string) => setError(msg), []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Pre-flight: WebGL availability check
    try {
      if (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver) {
        throw new Error('WebGL disabled in headless browser environment');
      }
      const canvas = document.createElement('canvas');
      if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) {
        throw new Error('WebGL context creation failed');
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setIsLoaded(true);
      return;
    }

    let viewer: Cesium.Viewer;
    let active = true;
    let canvas: HTMLCanvasElement | null = null;
    let pointerHandler: (() => void) | null = null;
    let requestRender: (() => void) | null = null;

    loadConfig().then((config) => {
      if (!active) return;
      
      if (config.CESIUM_ION_ACCESS_TOKEN) {
        Cesium.Ion.defaultAccessToken = config.CESIUM_ION_ACCESS_TOKEN;
      }

      try {
      // Firefox detection for MSAA workaround (from WWV)
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

      viewer = new Cesium.Viewer(containerRef.current, {
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
        msaaSamples: isFirefox ? 1 : 2,

        // Hide Cesium credits in a detached element
        creditContainer: document.createElement('div'),
      });

      viewerRef.current = viewer;
      (window as any).cesiumViewer = viewer;
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setIsLoaded(true);
      return;
    }

    // --- Performance tuning (WWV patterns) ---

    // Resolution scale: slightly under 1.0 saves GPU fill rate on integrated GPUs
    viewer.resolutionScale = 0.85;

    // Globe polygon detail: higher = fewer polygons = faster. Default is 2.
    viewer.scene.globe.maximumScreenSpaceError = 2.5;

    // Disable expensive FXAA post-process (we use MSAA instead)
    if (viewer.scene.postProcessStages.fxaa) {
      viewer.scene.postProcessStages.fxaa.enabled = false;
    }

    // --- Visual quality (Anime Sci-Fi Space Opera / WWT Aesthetics) ---
    viewer.scene.globe.enableLighting = true; // Stark shadows on terminator
    viewer.scene.globe.showWaterEffect = false;
    viewer.scene.globe.depthTestAgainstTerrain = true; // Proper occlusion
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020205'); // Space opera dark background
    viewer.scene.highDynamicRange = true; // Premium lighting dynamic range

    // Cool-toned luminous space atmosphere (Honkai: Star Rail inspired)
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.skyAtmosphere.brightnessShift = 0.15; // Enhanced brightness contrast
    viewer.scene.skyAtmosphere.saturationShift = 0.45; // Luminous saturation
    viewer.scene.skyAtmosphere.hueShift = -0.05; // Cool cyan/purple shift

    // Configure globe atmospheric lighting
    viewer.scene.globe.atmosphereBrightnessShift = 0.15;
    viewer.scene.globe.atmosphereSaturationShift = 0.45;
    viewer.scene.globe.atmosphereHueShift = -0.05;
    viewer.scene.globe.lightingFadeOutDistance = 1e7;
    viewer.scene.globe.lightingFadeInDistance = 2e7;


    // --- Camera controller improvements (from WWV) ---
    const sscc = viewer.scene.screenSpaceCameraController;
    // Intuitive mapping: left-drag = rotate/orbit, right-drag = translate/pan, pinch = zoom/tilt
    // Keep a ctrl+left modifier available for tilt when desired.
    sscc.rotateEventTypes = [
      Cesium.CameraEventType.LEFT_DRAG,
      Cesium.CameraEventType.PINCH,
    ];
    sscc.translateEventTypes = [
      Cesium.CameraEventType.RIGHT_DRAG,
      Cesium.CameraEventType.MIDDLE_DRAG,
    ];
    sscc.tiltEventTypes = [
      Cesium.CameraEventType.RIGHT_DRAG,
      Cesium.CameraEventType.PINCH,
      { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL },
    ];

    // Camera sensitivity tuning (user-controlled via UI store)
    try {
      const sensitivity = typeof useUIStore?.getState === 'function' ? useUIStore.getState().cameraSensitivity ?? 1.0 : 1.0;
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
    canvas = viewer.scene.canvas as HTMLCanvasElement;
    requestRender = () => {
      try { viewer.scene.requestRender(); } catch (err) { /* ignore */ }
    };
    pointerHandler = () => {
      if (requestRender) requestRender();
    };
    canvas.addEventListener('pointerdown', pointerHandler);
    canvas.addEventListener('pointerup', pointerHandler);
    canvas.addEventListener('pointermove', pointerHandler);
    canvas.addEventListener('wheel', pointerHandler, { passive: true } as AddEventListenerOptions);
    if ((viewer.camera as any)?.changed?.addEventListener) {
      try {
        (viewer.camera as any).changed.addEventListener(requestRender);
      } catch (e) {}
    }

    // Load imagery asynchronously (never blocks viewer creation)
    setupImagery(viewer)
      .catch((err) => console.warn('Imagery setup failed:', err))
      .finally(() => {
        if (viewerRef.current && !viewer.isDestroyed()) {
          setIsLoaded(true);
          viewer.scene.requestRender();
        }
      });

    // Initial camera: wide Earth view at 20,000 km
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 20_000_000),
    });
    }).catch((err) => {
      setError(err?.message ?? String(err));
      setIsLoaded(true);
    });

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
        if ((viewer as any)?.camera?.changed?.removeEventListener && requestRender) {
          try { (viewer as any).camera.changed.removeEventListener(requestRender); } catch (e) {}
        }
      } catch (e) {}

      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        (window as any).cesiumViewer = null;
      }
    };
  }, [containerRef]);

  return { viewer: viewerRef.current, isLoaded, error };
}
