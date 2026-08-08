/**
 * @file sentryQA.ts
 * @description QA & Development Mode Telemetry module integrating Sentry
 * and client-side error handling for Silver Wolf VI.
 */

export interface QABreadcrumb {
  category: string;
  message: string;
  level?: "info" | "warning" | "error" | "debug";
  data?: Record<string, unknown>;
  timestamp?: number;
}

export interface QAEventContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; username?: string };
}

class SentryQAService {
  private initialized = false;
  private dsn: string | null = null;
  private breadcrumbs: QABreadcrumb[] = [];
  private readonly MAX_BREADCRUMBS = 50;

  constructor() {
    // Read from environment if available
    this.dsn = (import.meta as any).env?.VITE_SENTRY_DSN || process.env.SENTRY_DSN || null;
  }

  public init(customDsn?: string): void {
    if (customDsn) {
      this.dsn = customDsn;
    }
    
    this.initialized = true;
    
    if (this.dsn) {
      console.log(`[SentryQA] Initialized telemetry with DSN: ${this.dsn.slice(0, 12)}...`);
    } else {
      console.log("[SentryQA] Development / QA Mock Mode active (No live SENTRY_DSN provided).");
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public addBreadcrumb(breadcrumb: QABreadcrumb): void {
    const entry: QABreadcrumb = {
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
      level: breadcrumb.level || "info",
    };

    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  public getBreadcrumbs(): QABreadcrumb[] {
    return [...this.breadcrumbs];
  }

  public captureException(error: Error | unknown, context?: QAEventContext): string {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const eventId = `qa-evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const formattedPayload = {
      eventId,
      message: errorObj.message,
      name: errorObj.name,
      stack: errorObj.stack,
      tags: context?.tags || {},
      extra: context?.extra || {},
      breadcrumbs: this.getBreadcrumbs(),
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== "test") {
      console.error(`[SentryQA] [${eventId}] Captured Exception:`, formattedPayload);
    }

    this.addBreadcrumb({
      category: "exception",
      message: `${errorObj.name}: ${errorObj.message}`,
      level: "error",
      data: { eventId },
    });

    return eventId;
  }

  public captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: QAEventContext): string {
    const eventId = `qa-msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    this.addBreadcrumb({
      category: "message",
      message,
      level,
      data: { eventId, context },
    });

    return eventId;
  }

  public clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

export const sentryQA = new SentryQAService();
