import { create } from 'zustand';

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
    
    // Asynchronously send to bridge for file logging
    fetch('http://localhost:8001/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full),
    }).catch(() => {
      /* ignore bridge logging failures */
    });

    set((s) => ({ entries: [full, ...s.entries].slice(0, 500) }));
  },
  clear: () => set({ entries: [] }),
  export: () => JSON.stringify(get().entries, null, 2),
}));

// Auto-capture uncaught exceptions, promise rejections, and client load performance
if (typeof window !== 'undefined') {
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
      } catch (e) {
        // Fallback performance check
      }
    }, 1000);
  });
}

export default useDiagnosticsStore;
