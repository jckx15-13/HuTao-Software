/**
 * Sentry Integration Service
 * Provides telemetry dispatch, DSN configuration, mock fallback logging,
 * and context enrichment (hardware specs, WebGL, CodeRabbit status).
 */

export interface SentryEvent {
  eventId: string;
  timestamp: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  userHardware?: Record<string, unknown>;
}

function getEnvVar(key: string): string {
  if (key === 'VITE_SENTRY_DSN') return import.meta.env.VITE_SENTRY_DSN || '';
  return import.meta.env.MODE || '';
}

class SentryIntegrationService {
  private dsn: string = '';
  private enabled: boolean = false;
  private eventsSentCount: number = 0;
  private lastEvent: SentryEvent | null = null;

  constructor() {
    // Check environment or localStorage for Sentry DSN
    const envDsn = getEnvVar('VITE_SENTRY_DSN');
    const storedDsn = typeof localStorage !== 'undefined' ? localStorage.getItem('sw_sentry_dsn') || '' : '';
    this.dsn = envDsn || storedDsn;
    this.enabled = Boolean(this.dsn);
  }

  public getDSN(): string {
    return this.dsn;
  }

  public setDSN(newDsn: string): void {
    this.dsn = newDsn.trim();
    this.enabled = Boolean(this.dsn);
    if (typeof localStorage !== 'undefined') {
      try {
        if (this.dsn) localStorage.setItem('sw_sentry_dsn', this.dsn);
        else localStorage.removeItem('sw_sentry_dsn');
      } catch { /* Storage can be unavailable in private or restricted contexts. */ }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getStats() {
    return {
      dsn: this.dsn ? `${this.dsn.slice(0, 12)}...` : 'Unconfigured',
      enabled: this.enabled,
      eventsSentCount: this.eventsSentCount,
      lastEventTimestamp: this.lastEvent?.timestamp || null,
      mode: 'Local Telemetry Buffer'
    };
  }

  public captureException(error: Error | string, extraContext: Record<string, unknown> = {}): SentryEvent {
    const message = typeof error === 'string' ? error : error.message || String(error);
    const stack = typeof error === 'object' && error.stack ? error.stack : undefined;

    const event: SentryEvent = {
      eventId: `sntry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      stack,
      tags: {
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        environment: getEnvVar('MODE') || 'development'
      },
      extra: extraContext
    };

    this.dispatchSentryEvent(event);
    return event;
  }

  public captureMessage(message: string, level: SentryEvent['level'] = 'info', extraContext: Record<string, unknown> = {}): SentryEvent {
    const event: SentryEvent = {
      eventId: `sntry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      tags: {
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        environment: getEnvVar('MODE') || 'development'
      },
      extra: extraContext
    };

    this.dispatchSentryEvent(event);
    return event;
  }

  private dispatchSentryEvent(event: SentryEvent) {
    this.eventsSentCount++;
    this.lastEvent = event;

    // This lightweight client is a local diagnostics buffer, not a Sentry SDK.
    // Do not claim remote delivery or issue malformed envelope requests.
  }
}

export const sentryService = new SentryIntegrationService();
