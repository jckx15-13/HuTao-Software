import { create } from 'zustand';
import { bridgeUrl, getBridgeBaseUrl } from '../lib/bridgeConfig';

export type DiagnosticLevel = 'error' | 'warning' | 'info' | 'debug';

export interface DiagnosticEntry {
  id: string;
  level: DiagnosticLevel;
  message: string;
  stack?: string | null;
  timestamp: number;
  metadata?: Record<string, any> | null;
  suggestion?: string | null;
}

interface DiagnosticsState {
  entries: DiagnosticEntry[];
  add: (entry: Omit<DiagnosticEntry, 'id' | 'timestamp'>) => void;
  clear: () => void;
  export: () => string;
}

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const SENSITIVE_KEYS = /(key|token|auth|password|secret|notion|weather|credential)/i;
const CELESTRAK_TLE_PATTERN = /celestrak\.org\/NORAD\/elements\/gp\.php/i;
const TRACKED_FETCH_PATHS = ['/api/', '/chat', '/status', '/git/status', '/sync', '/openapi'];

function shouldTrackFetchLatency(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('/log')) return false;
  return TRACKED_FETCH_PATHS.some((path) => url.includes(path));
}

function isSatelliteTelemetryFetch(url: string): boolean {
  if (!url) return false;
  if (CELESTRAK_TLE_PATTERN.test(url)) return true;

  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    const proxiedUrl = parsed.searchParams.get('url') || '';
    return CELESTRAK_TLE_PATTERN.test(decodeURIComponent(proxiedUrl));
  } catch (e) {
    return false;
  }
}

function sanitize(data: any): any {
  if (!data) return data;

  if (typeof data === 'string') {
    // Redact common API key patterns in URLs or strings
    return data.replace(/([&?]?(?:key|token|auth|apiKey)=)([a-zA-Z0-9_-]{8,})/gi, '$1REDACTED');
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  if (typeof data === 'object') {
    const clean: any = {};
    for (const [k, v] of Object.entries(data)) {
      if (SENSITIVE_KEYS.test(k)) {
        clean[k] = 'REDACTED';
      } else {
        clean[k] = sanitize(v);
      }
    }
    return clean;
  }

  return data;
}

export const useDiagnosticsStore = create<DiagnosticsState>((set, get) => ({
  entries: [],
  add: (entry) => {
    const sanitizedMetadata = sanitize(entry.metadata || {});
    const sanitizedMessage = sanitize(entry.message);

    const snapshot = (() => {
      try {
        const mem = (performance as any)?.memory ?? null;
        return {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          url: sanitize(typeof window !== 'undefined' ? window.location.href : null),
          memory: mem,
          time: new Date().toISOString(),
        };
      } catch (e) {
        return null;
      }
    })();

    const full: DiagnosticEntry = {
      id: makeId(),
      timestamp: Date.now(),
      metadata: { ...sanitizedMetadata, snapshot },
      stack: entry.stack || null,
      message: sanitizedMessage,
      level: entry.level || 'error',
      suggestion: (entry as any).suggestion || null,
    };

    const isHeadless = typeof window !== 'undefined' && (
      /HeadlessChrome/i.test(navigator.userAgent) ||
      navigator.webdriver ||
      window.location.search.includes('fallback')
    );

    if (!isHeadless) {
      // Asynchronously send to bridge for file logging
      fetch(bridgeUrl('/log'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(full),
      }).catch(() => {
        /* ignore bridge logging failures */
      });
    }

    set((s) => ({ entries: [full, ...s.entries].slice(0, 500) }));
  },
  clear: () => set({ entries: [] }),
  export: () => JSON.stringify(get().entries, null, 2),
}));

// Auto-capture uncaught exceptions, promise rejections, and client load performance
if (typeof window !== 'undefined') {
  // 1. Capture phase listener for resource load errors (img, script, link, etc.)
  window.addEventListener('error', (event) => {
    try {
      const target = event.target as any;
      if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG' || target.tagName === 'VIDEO')) {
        const src = target.src || target.href || 'unknown source';
        useDiagnosticsStore.getState().add({
          level: 'warning',
          message: `Resource load failure: <${target.tagName.toLowerCase()}> from url "${src}"`,
          metadata: { tagName: target.tagName, src },
          suggestion: 'Verify network connection, asset path correctness, or resource CORS policies.'
        });
      }
    } catch (e) {}
  }, true);

  // 2. Uncaught runtime exceptions
  window.addEventListener('error', (event) => {
    // Avoid double logging if message already captured
    if (event.message?.includes('Script error.')) return;

    useDiagnosticsStore.getState().add({
      level: 'error',
      message: event.message || 'Unhandled runtime error',
      stack: event.error?.stack || null,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      suggestion: 'Verify null/undefined checks, verify state initialization, or check imports.'
    });
  });

  // 3. Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason);
    useDiagnosticsStore.getState().add({
      level: 'error',
      message: `Unhandled promise rejection: ${msg}`,
      stack: event.reason?.stack || null,
      metadata: { reason: String(event.reason) },
      suggestion: 'Ensure async functions are wrapped in try/catch or attach a .catch() block to the promise.'
    });
  });

  // 4. Global fetch latency & error interceptor
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
    const shouldTrack = shouldTrackFetchLatency(url);

    if (!shouldTrack && !isSatelliteTelemetryFetch(url)) {
      return originalFetch.apply(window, arguments as any);
    }

    const startTime = performance.now();
    const isSatelliteTelemetryRequest = isSatelliteTelemetryFetch(url);

    try {
      const response = await originalFetch.apply(window, arguments as any);
      const duration = performance.now() - startTime;

      if (!response.ok && !isSatelliteTelemetryRequest) {
        useDiagnosticsStore.getState().add({
          level: 'error',
          message: `API request failed: ${response.status} ${response.statusText} on ${url}`,
          metadata: { url, status: response.status, statusText: response.statusText, durationMs: duration },
          suggestion: 'Check if the backend bridge server is running, or verify API parameters and CORS configurations.'
        });
      } else if (duration > 2000 && url.includes('/api/')) {
        useDiagnosticsStore.getState().add({
          level: 'warning',
          message: `High latency API response: ${duration.toFixed(0)}ms on ${url}`,
          metadata: { url, durationMs: duration },
          suggestion: 'Optimize database indexes, reduce payload sizes, or check backend performance metrics.'
        });
      }
      return response;
    } catch (err: any) {
      const duration = performance.now() - startTime;
      if (isSatelliteTelemetryRequest) {
        throw err;
      }

      useDiagnosticsStore.getState().add({
        level: 'error',
        message: `API request error: "${err.message || err}" on ${url}`,
        metadata: { url, durationMs: duration, error: String(err) },
        suggestion: 'Verify the FastAPI server is running at port 8001 and check browser network tab.'
      });
      throw err;
    }
  };

  // 5. Intercept console.error and console.warn to capture third-party/lib issues
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = function (...args) {
    originalConsoleError.apply(console, args);
    try {
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      // Filter out redundant logs or log loop triggers
      if (msg.includes('/log') || msg.includes('Script error.') || msg.includes('Cesium')) return;
      useDiagnosticsStore.getState().add({
        level: 'error',
        message: `Console Error: ${msg.substring(0, 300)}`,
        suggestion: 'Trace this error using browser devtools stack trace or check related components.'
      });
    } catch (e) {}
  };

  console.warn = function (...args) {
    originalConsoleWarn.apply(console, args);
    try {
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      if (msg.includes('/log') || msg.includes('Cesium')) return;
      useDiagnosticsStore.getState().add({
        level: 'warning',
        message: `Console Warning: ${msg.substring(0, 300)}`,
        suggestion: 'Resolve warnings to ensure optimal performance and standard-compliant rendering.'
      });
    } catch (e) {}
  };

  // 6. Navigation Performance and Vitals check
  window.addEventListener('load', () => {
    setTimeout(() => {
      try {
        const [entry] = performance.getEntriesByType('navigation') as any[];
        if (entry) {
          const loadTime = entry.loadEventEnd - entry.startTime;
          const domReady = entry.domContentLoadedEventEnd - entry.startTime;
          const dnsTime = entry.domainLookupEnd - entry.domainLookupStart;
          const responseTime = entry.responseEnd - entry.requestStart;

          useDiagnosticsStore.getState().add({
            level: 'info',
            message: `Telemetry Vitals initialized. load: ${loadTime.toFixed(0)}ms | dom: ${domReady.toFixed(0)}ms | network: ${dnsTime.toFixed(0)}ms`,
            metadata: { loadTime, domReady, dnsTime, responseTime },
            suggestion: 'For optimal startup, minimize direct imports, utilize React.lazy, or enable bundle compression.'
          });
        }

        // WebGL capability check
        const isHeadless = typeof window !== 'undefined' && (
          /HeadlessChrome/i.test(navigator.userAgent) ||
          navigator.webdriver ||
          window.location.search.includes('fallback')
        );

        if (isHeadless) {
          useDiagnosticsStore.getState().add({
            level: 'warning',
            message: 'WebGL check skipped in headless environment.',
            suggestion: 'Headless fallback is enabled.'
          });
        } else {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (!gl) {
            useDiagnosticsStore.getState().add({
              level: 'warning',
              message: 'WebGL context creation failed: Hardware acceleration might be disabled or unsupported.',
              suggestion: 'Enable hardware acceleration in Chrome settings or update graphics driver configurations.'
            });
          }
        }

        // 7. WebGL Context Loss listener on page canvases
        document.querySelectorAll('canvas').forEach(c => {
          c.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            useDiagnosticsStore.getState().add({
              level: 'error',
              message: 'WebGL context lost detected on active viewport canvas.',
              suggestion: 'Reduce resolution scale, disable shadows, or reload the page to restore graphics context.'
            });
          });
        });

        // 8. Viewport Resolution Check
        const checkViewport = () => {
          if (window.innerWidth < 768 || window.innerHeight < 500) {
            useDiagnosticsStore.getState().add({
              level: 'info',
              message: `Compact viewport detected: ${window.innerWidth}x${window.innerHeight}. Layout has adapted to responsive mode.`,
              suggestion: 'Use full-height/width mode for maximum panel density if overlaps are seen.'
            });
          }
        };
        checkViewport();
        window.addEventListener('resize', () => {
          // Throttle check
          if ((window as any).__viewportCheckTimeout) clearTimeout((window as any).__viewportCheckTimeout);
          (window as any).__viewportCheckTimeout = setTimeout(checkViewport, 5000);
        });

        // 9. Periodic Bridge Server Health Checks
        let lastBridgeState = 'unknown';
        const checkBridgeHealth = async () => {
          try {
            const res = await originalFetch(bridgeUrl('/status'));
            const data = await res.json();
            if (data.ready) {
              if (lastBridgeState !== 'ready') {
                useDiagnosticsStore.getState().add({
                  level: 'info',
                  message: 'FastAPI bridge server and Odysseus backend engine are online and healthy.',
                  suggestion: 'System operates under optimal telemetry sync.'
                });
                lastBridgeState = 'ready';
              }
            } else {
              if (lastBridgeState !== 'starting') {
                useDiagnosticsStore.getState().add({
                  level: 'warning',
                  message: 'FastAPI bridge server is online, but Odysseus backend engine is starting...',
                  suggestion: 'Wait a few seconds for database collections to mount.'
                });
                lastBridgeState = 'starting';
              }
            }
          } catch (e) {
            if (lastBridgeState !== 'offline') {
              useDiagnosticsStore.getState().add({
                level: 'error',
                message: `FastAPI bridge server is offline or unreachable at ${getBridgeBaseUrl()}.`,
                suggestion: 'Restart services via "node launch.js" or update the bridge URL override in Developer Settings.'
              });
              lastBridgeState = 'offline';
            }
          }
        };
        // Initial delayed check, then periodic
        setTimeout(checkBridgeHealth, 2000);
        setInterval(checkBridgeHealth, 15000);

      } catch (e) {
        // Fallback performance check
      }
    }, 1000);
  });
}

export default useDiagnosticsStore;
