
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";
import ErrorFallback from "./ErrorFallback";

const logger = createTimeLogger('GlobalErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorCount: number;
}

class GlobalErrorBoundary extends Component<Props, State> {
  // Track error reporting to prevent flooding
  private lastErrorTime: number = 0;
  private readonly ERROR_THROTTLE_MS = 5000; // 5 seconds between error reports
  
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return { 
      hasError: true, 
      error,
      errorCount: 1
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const now = Date.now();
    
    // Only log to console and report to monitoring if we're not flooding
    if (now - this.lastErrorTime > this.ERROR_THROTTLE_MS) {
      logger.error("GlobalErrorBoundary caught an error", error, errorInfo);
      this.lastErrorTime = now;
      
      // Here we could report to an error monitoring service with throttling
      // But we'll avoid adding a dependency on Sentry directly
    } else {
      logger.debug("Suppressed duplicate error report");
    }
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  resetErrorBoundary = (): void => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorCount: 0
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback 
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
          errorCount={this.state.errorCount}
        />
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
