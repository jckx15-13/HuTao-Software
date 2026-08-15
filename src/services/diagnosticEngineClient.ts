/**
 * Lightweight browser-side client for diagnostic-engine.
 * Forwards sanitized diagnostic entries via fetch — never imports the
 * engine package directly (it pulls in express/ws/fs, which don't belong
 * in a browser bundle). No-ops silently if the engine isn't running.
 */
import type { DiagnosticEntry, DiagnosticLevel } from '../store/diagnosticsStore';

declare const __SILVER_WOLF_DIAGNOSTIC_ENGINE_URL__: string | undefined;

const FALLBACK_ENGINE_URL = 'http://127.0.0.1:9500';

const LEVEL_TO_SEVERITY: Record<DiagnosticLevel, string> = {
  error: 'error',
  warning: 'warn',
  info: 'info',
  debug: 'debug'
};

const LEVEL_TO_CATEGORY: Record<DiagnosticLevel, string> = {
  error: 'runtime',
  warning: 'runtime',
  info: 'runtime',
  debug: 'runtime'
};

function engineUrl(): string {
  if (typeof __SILVER_WOLF_DIAGNOSTIC_ENGINE_URL__ !== 'undefined' && __SILVER_WOLF_DIAGNOSTIC_ENGINE_URL__) {
    return __SILVER_WOLF_DIAGNOSTIC_ENGINE_URL__;
  }
  return FALLBACK_ENGINE_URL;
}

let engineUnreachable = false;
let lastFailureLogAt = 0;

/** JSON.stringify replacer that breaks cycles instead of throwing. */
function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
    }
    return val;
  });
}

/**
 * Fire-and-forget forward of a diagnostics store entry to diagnostic-engine's
 * ingest endpoint. Never throws. Backs off after the first failed request so
 * a missing engine process doesn't spam network errors for every diagnostic.
 */
export function reportToEngine(entry: DiagnosticEntry, source = 'silver-wolf-vi'): void {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  if (engineUnreachable && Date.now() - lastFailureLogAt < 60_000) return;

  try {
    const payload = {
      id: entry.id,
      timestamp: entry.timestamp,
      severity: LEVEL_TO_SEVERITY[entry.level] || 'info',
      category: LEVEL_TO_CATEGORY[entry.level] || 'runtime',
      message: entry.message,
      stack: entry.stack || undefined,
      source,
      metadata: entry.metadata || undefined,
      sanitized: true
    };

    fetch(`${engineUrl()}/api/diagnostics/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeStringify(payload)
    })
      .then((res) => {
        if (res.ok) {
          engineUnreachable = false;
        }
      })
      .catch(() => {
        engineUnreachable = true;
        lastFailureLogAt = Date.now();
      });
  } catch {
    engineUnreachable = true;
    lastFailureLogAt = Date.now();
  }
}
