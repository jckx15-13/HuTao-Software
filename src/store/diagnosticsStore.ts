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

export const useDiagnosticsStore = create<DiagnosticsState>((set, get) => ({
  entries: [],
  add: (entry) => {
    const snapshot = (() => {
      try {
        const mem = (performance as any)?.memory ?? null;
        return {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          url: typeof window !== 'undefined' ? window.location.href : null,
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
      metadata: { ...(entry.metadata || {}), snapshot },
      stack: entry.stack || null,
      message: entry.message,
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
