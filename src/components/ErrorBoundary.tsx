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

    try {
      // Record to diagnostics store for dev inspection and export
      useDiagnosticsStore.getState().add({
        level: 'error',
        message: error.message || 'ErrorBoundary caught an error',
        stack: error.stack || null,
        metadata: { errorInfo },
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
      return (        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            minHeight: '120px',
            background: 'rgba(10, 11, 16, 0.95)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 183, 177, 0.15)',
            color: '#EAECEE',
            fontFamily: '"Inter", system-ui, sans-serif',
            padding: '1.5rem',
            textAlign: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(245, 183, 177, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            ⚠
          </div>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: '#F5B7B1',
              margin: 0,
            }}
          >
            {fallbackMessage || 'Component Error'}
          </span>
          <p
            style={{
              fontSize: 11,
              color: '#85929E',
              maxWidth: 360,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {isAutoRetrying
              ? 'Auto-retrying in a moment...'
              : (this.state.error?.message || 'An unexpected error occurred')}
          </p>
          {!isAutoRetrying && (
            <button
              onClick={this.handleReset}
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                padding: '6px 20px',
                borderRadius: 6,
                border: '1px solid rgba(138, 91, 199, 0.4)',
                background: 'rgba(138, 91, 199, 0.15)',
                color: '#A67BEA',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    // Fullscreen variant (original behavior)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          background: '#0a0b10',
          color: '#EAECEE',
          fontFamily: '"Inter", system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(245, 183, 177, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          ⚠
        </div>
        <h1
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#F5B7B1',
            margin: 0,
          }}
        >
          SYSTEM // RUNTIME ERROR
        </h1>
        <p style={{ fontSize: 14, color: '#85929E', maxWidth: 480, lineHeight: 1.6 }}>
          {fallbackMessage || 'An unexpected error occurred. Your chat history has been preserved in local storage.'}
        </p>
        <pre
          style={{
            fontSize: 12,
            color: '#F5B7B1',
            background: 'rgba(245, 183, 177, 0.08)',
            border: '1px solid rgba(245, 183, 177, 0.2)',
            borderRadius: 8,
            padding: '12px 20px',
            maxWidth: 560,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {this.state.error?.message || 'Unknown error'}
        </pre>
        <button
          onClick={this.handleReset}
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: '10px 28px',
            borderRadius: 8,
            border: '1px solid rgba(138, 91, 199, 0.4)',
            background: 'rgba(138, 91, 199, 0.15)',
            color: '#A67BEA',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }
}
