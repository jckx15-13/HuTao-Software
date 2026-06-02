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

export default useDiagnosticsStore;
