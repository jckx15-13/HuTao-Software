import React, { type ErrorInfo, type ReactNode } from 'react';
import { useDiagnosticsStore } from '@/store/diagnosticsStore';

interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: 'fullscreen' | 'inline';
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private autoRetryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Silver Wolf VI] Unhandled error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    const isChunkError = 
      error.name === 'ChunkLoadError' || 
      /Loading chunk .* failed/.test(error.message);

    try {
      // Record to diagnostics store for dev inspection and export
      useDiagnosticsStore.getState().add({
        level: 'error',
        message: isChunkError ? 'Chunk load failure detected. Forcing cache refresh.' : (error.message || 'ErrorBoundary caught an error'),
        stack: error.stack || null,
        metadata: { errorInfo, isChunkError },
      });
    } catch (e) {
      console.warn('[ErrorBoundary] failed to record diagnostic', e);
    }

    // Detect headless test context
    const isHeadless = typeof window !== 'undefined' && (
      /HeadlessChrome/i.test(navigator.userAgent) ||
      navigator.webdriver ||
      window.location.search.includes('fallback')
    );

    if (isChunkError && !isHeadless) {
      console.log('[ErrorBoundary] Chunk error detected, forcing reload...');
      window.location.reload();
      return;
    }

    // Auto-retry with exponential backoff, except in headless/E2E test environments
    const MAX_RETRIES = 3;
    if (this.state.retryCount < MAX_RETRIES && !isHeadless) {
      const backoffDelay = 3000 * Math.pow(2, this.state.retryCount);
      console.log(`[ErrorBoundary] Auto-retry ${this.state.retryCount + 1}/${MAX_RETRIES} in ${backoffDelay}ms...`);
      
      this.autoRetryTimer = setTimeout(() => {
        this.handleReset();
      }, backoffDelay);
    }
  }

  componentWillUnmount() {
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
      this.autoRetryTimer = null;
    }
  }

  handleReset = () => {
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
      this.autoRetryTimer = null;
    }
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { variant = 'fullscreen', fallbackMessage } = this.props;
    const isAutoRetrying = this.state.retryCount === 0;

    if (variant === 'inline') {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[120px] glass-panel-strong border-danger/20 p-6 text-center gap-3">
          <div className="w-9 h-9 rounded-full bg-danger/10 flex items-center justify-center text-lg text-danger">
            ⚠
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-danger/80">
            {fallbackMessage || 'Component Error'}
          </span>
          <p className="text-[11px] text-text-muted max-w-[360px] leading-relaxed">
            {isAutoRetrying
              ? 'Auto-retrying in a moment...'
              : (this.state.error?.message || 'An unexpected error occurred')}
          </p>
          {!isAutoRetrying && (
            <button
              onClick={this.handleReset}
              className="font-mono text-[10px] uppercase tracking-widest px-5 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    // Fullscreen variant
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] min-h-[100dvh] w-full bg-base text-text-main p-8 text-center gap-6">
        <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-2xl text-danger animate-pulse">
          ⚠
        </div>
        <div className="space-y-2">
          <h1 className="font-mono text-[12px] uppercase tracking-[0.3em] text-danger">
            SYSTEM // RUNTIME ERROR
          </h1>
          <p className="text-[14px] text-text-muted max-w-lg leading-relaxed">
            {fallbackMessage || 'An unexpected error occurred. Your session state has been preserved.'}
          </p>
        </div>
        
        <pre className="text-[12px] text-danger/80 bg-danger/5 border border-danger/20 rounded-lg p-5 max-w-xl overflow-auto scroller font-mono whitespace-pre-wrap break-all">
          {this.state.error?.message || 'Unknown error'}
        </pre>

        <button
          onClick={this.handleReset}
          className="font-mono text-[11px] uppercase tracking-[0.2em] px-8 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          Force System Reset
        </button>
      </div>
    );
  }
}
