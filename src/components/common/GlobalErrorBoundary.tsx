
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";
import ErrorFallback from "./ErrorFallback";
import AppStateRecovery from "@/utils/error/errorRecovery";

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
      
      // Attempt recovery for certain error patterns
      if (this.shouldAttemptRecovery(error)) {
        logger.info("Attempting automatic recovery...");
        AppStateRecovery.attemptRecovery();
      }
    } else {
      logger.debug("Suppressed duplicate error report");
    }
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  // Check if error type indicates we should try recovery
  shouldAttemptRecovery(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // Look for indicators of state inconsistency
    const stateIssueIndicators = [
      'undefined is not an object',
      'cannot read property',
      'null is not an object',
      'is not a function',
      'is not iterable',
      'is not defined'
    ];
    
    return stateIssueIndicators.some(indicator => errorMessage.includes(indicator));
  }

  resetErrorBoundary = (): void => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorCount: 0
    });
  };

  // Perform advanced recovery with page reload
  handleDeepRecovery = (): void => {
    // Clear any problematic state
    AppStateRecovery.attemptRecovery();
    
    // If we haven't already attempted a reload, try reloading the page
    if (!AppStateRecovery.hasRecentlyReloaded()) {
      AppStateRecovery.forceReload();
    } else {
      alert("Multiple reload attempts detected. Please try clearing your browser cache and reloading the page manually.");
    }
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
          deepRecovery={this.handleDeepRecovery}
          errorCount={this.state.errorCount}
        />
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
