/**
 * @file sentryQA.ts
 * @description QA & Development Mode Telemetry module integrating Sentry
 * and client-side error handling for Silver Wolf VI.
 */
import { reportToEngine } from '../../services/diagnosticEngineClient';
import { sentryService } from '../../services/sentryService';

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
  private breadcrumbs: QABreadcrumb[] = [];
  private readonly MAX_BREADCRUMBS = 50;

  public init(customDsn?: string): void {
    if (customDsn) {
      sentryService.setDSN(customDsn);
    }
    
    this.initialized = true;
    
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
    const eventId = sentryService.captureException(errorObj, context?.extra).eventId;

    // The SDK and diagnostic engine receive this event directly. Logging it to
    // console.error would be captured again by the diagnostics console listener.

    this.addBreadcrumb({
      category: "exception",
      message: `${errorObj.name}: ${errorObj.message}`,
      level: "error",
      data: { eventId },
    });

    // Additive forward to diagnostic-engine (fire-and-forget, no-ops if not running)
    reportToEngine({
      id: eventId,
      timestamp: Date.now(),
      level: "error",
      message: errorObj.message,
      stack: errorObj.stack || null,
      metadata: { tags: context?.tags, extra: context?.extra },
    });

    return eventId;
  }

  public captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: QAEventContext): string {
    const eventId = sentryService.captureMessage(message, level, context?.extra).eventId;

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
