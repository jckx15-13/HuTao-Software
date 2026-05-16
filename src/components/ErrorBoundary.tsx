import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Silver Wolf VI] Unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

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
          An unexpected error occurred. Your chat history has been preserved in local storage.
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
