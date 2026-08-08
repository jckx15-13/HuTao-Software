import React, { Component, ErrorInfo, ReactNode } from "react";
import { sentryQA } from "@/core/qa/sentryQA";

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    eventId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const eventId = sentryQA.captureException(error, {
      tags: {
        component: this.props.name || "ErrorBoundary",
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ eventId });
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <div className="p-4 m-2 bg-red-950/80 border border-red-500/50 rounded text-red-200 font-mono text-xs">
          <h3 className="font-bold text-red-400 mb-1">
            ⚠️ Component Error [{this.props.name || "Unknown"}]
          </h3>
          <p className="mb-2">{this.state.error?.message || "An unexpected error occurred."}</p>
          {this.state.eventId && (
            <span className="text-[10px] opacity-75">Event ID: {this.state.eventId}</span>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
