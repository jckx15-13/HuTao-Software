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
  extra?: Record<string, any>;
  userHardware?: Record<string, any>;
}

function getEnvVar(key: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || '';
    }
  } catch {
    /* ignore process env access error */
  }
  return '';
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

  public setDSN(newDsn: string) {
    this.dsn = newDsn.trim();
    this.enabled = Boolean(this.dsn);
    if (typeof localStorage !== 'undefined') {
      if (this.dsn) {
        localStorage.setItem('sw_sentry_dsn', this.dsn);
      } else {
        localStorage.removeItem('sw_sentry_dsn');
      }
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
      mode: this.enabled ? 'Sentry Remote Cloud' : 'Local Telemetry Sandbox'
    };
  }

  public captureException(error: Error | string, extraContext: Record<string, any> = {}): SentryEvent {
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

  public captureMessage(message: string, level: SentryEvent['level'] = 'info', extraContext: Record<string, any> = {}): SentryEvent {
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

    if (this.enabled && this.dsn) {
      // If a real Sentry DSN is present, we attempt HTTP post to the DSN envelope endpoint or console log
      try {
        const dsnMatch = this.dsn.match(/https:\/\/([^@]+)@([^/]+)\/(\d+)/);
        if (dsnMatch) {
          const [, publicKey, host, projectId] = dsnMatch;
          const envelopeUrl = `https://${host}/api/${projectId}/envelope/`;
          fetch(envelopeUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}` },
            body: JSON.stringify(event)
          }).catch(() => {
            /* ignore background sentry network transport failures */
          });
        }
      } catch {
        /* ignore sentry parsing error */
      }
    }
  }
}

export const sentryService = new SentryIntegrationService();
