/**
 * Visual & Developer Hardware Inspector Service
 * Probes screen, display scale, WebGL GPU renderer, CPU cores, RAM memory,
 * and captures live DOM/Canvas frame snapshots so the AI can "see" what the developer sees.
 */

import { bridgeUrl, isBridgeEnabled } from '../lib/bridgeConfig';

export interface HardwareSpecs {
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  colorDepth: number;
  orientation: string;
  hardwareConcurrency: number;
  deviceMemoryGiB: number | null;
  maxTouchPoints: number;
  webglVendor: string;
  webglRenderer: string;
  webglVersion: string;
  backendHardware?: {
    platform: string;
    arch: string;
    ram_gib: number;
    ram_available_gib: number;
    gpus: Array<{ name: string; vendor: string; vram_bytes: number }>;
    dedicated_vram_gib: number;
    inference_mode: string;
    model_budget_gib: number;
  } | null;
}

export interface VisualSnapshot {
  timestamp: string;
  dataUrl: string | null;
  dimensions: { width: number; height: number };
  activePanels: string[];
  summaryText: string;
}

class VisualInspectorService {
  /**
   * Gather complete developer hardware & display properties
   */
  public async getHardwareSpecs(): Promise<HardwareSpecs> {
    if (typeof window === 'undefined') {
      return {
        screenWidth: 1920,
        screenHeight: 1080,
        viewportWidth: 1920,
        viewportHeight: 1080,
        devicePixelRatio: 1,
        colorDepth: 24,
        orientation: 'landscape-primary',
        hardwareConcurrency: 8,
        deviceMemoryGiB: 16,
        maxTouchPoints: 0,
        webglVendor: 'Unknown',
        webglRenderer: 'Unknown',
        webglVersion: 'WebGL 2.0',
        backendHardware: null
      };
    }

    let webglVendor = 'Software / Unknown';
    let webglRenderer = 'Basic Canvas Renderer';
    let webglVersion = 'None';

    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        webglVersion = gl.getParameter((gl as any).VERSION || 0x1F02) || 'WebGL 1.0';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || webglVendor;
          webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || webglRenderer;
        } else {
          webglVendor = gl.getParameter((gl as any).VENDOR || 0x1F00) || webglVendor;
          webglRenderer = gl.getParameter((gl as any).RENDERER || 0x1F01) || webglRenderer;
        }
      }
    } catch {
      /* ignore webgl probe error */
    }

    const specs: HardwareSpecs = {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      colorDepth: window.screen.colorDepth || 24,
      orientation: window.screen.orientation?.type || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'),
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemoryGiB: (navigator as any).deviceMemory || null,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      webglVendor,
      webglRenderer,
      webglVersion,
      backendHardware: null
    };

    if (isBridgeEnabled()) {
      try {
        const res = await fetch(bridgeUrl('/api/local_llm/recommendations'));
        if (res.ok) {
          const data = await res.json();
          if (data.hardware) {
            specs.backendHardware = data.hardware;
          }
        }
      } catch {
        /* ignore bridge hardware fetch errors */
      }
    }

    return specs;
  }

  /**
   * Capture live visual viewport snapshot (Canvas frames or DOM layout snapshot)
   */
  public async captureViewportSnapshot(): Promise<VisualSnapshot> {
    const timestamp = new Date().toISOString();
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;

    let dataUrl: string | null = null;
    let summaryText = `Viewport ${width}x${height}px @ scale ${typeof window !== 'undefined' ? window.devicePixelRatio : 1}x.`;

    try {
      // 1. First search for existing canvas elements (Map, Cesium, Satellite globe, Astronomy canvas)
      const activeCanvases = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
      if (activeCanvases.length > 0) {
        // Use largest rendered canvas
        const primaryCanvas = activeCanvases.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
        if (primaryCanvas) {
          try {
            dataUrl = primaryCanvas.toDataURL('image/png', 0.85);
            summaryText += ` Captured primary viewport canvas (${primaryCanvas.width}x${primaryCanvas.height}).`;
          } catch {
            /* ignore tainted canvas error */
          }
        }
      }

      // 2. If no direct canvas captured, generate lightweight DOM visual matrix preview
      if (!dataUrl) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, 1280);
        canvas.height = Math.min(height, 720);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill dark tactical background matching Silver Wolf theme
          ctx.fillStyle = '#0b0f19';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Grid lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          // Draw Overlay HUD text
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 14px monospace';
          ctx.fillText(`[SILVER WOLF VI - DEVELOPER VIEWPORT SNAPSHOT]`, 20, 30);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px monospace';
          ctx.fillText(`Resolution: ${width}x${height} (Scale ${window.devicePixelRatio}x)`, 20, 55);
          ctx.fillText(`Time: ${timestamp}`, 20, 75);

          dataUrl = canvas.toDataURL('image/png');
        }
      }
    } catch (e) {
      /* ignore capture error */
    }

    const activePanels: string[] = [];
    if (typeof document !== 'undefined') {
      if (document.querySelector('[data-panel="left"]')) activePanels.push('Navigation Drawer');
      if (document.querySelector('[data-panel="right"]')) activePanels.push('Diagnostics & Telemetry');
      if (document.querySelector('canvas')) activePanels.push('3D Visual Canvas');
    }

    return {
      timestamp,
      dataUrl,
      dimensions: { width, height },
      activePanels,
      summaryText
    };
  }
}

export const visualInspectorService = new VisualInspectorService();
