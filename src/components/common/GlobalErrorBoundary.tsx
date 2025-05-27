
import React, { Component, ErrorInfo, ReactNode } from "react";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";
import ErrorFallback from "./ErrorFallback";
import AppStateRecovery from "@/utils/error/errorRecovery";

// Enhanced logging for GlobalErrorBoundary
const timestamp = () => new Date().toISOString();
const log = (message: string, data?: any) => {
  console.log(`[${timestamp()}] GLOBAL_ERROR_BOUNDARY: ${message}`, data || '');
};

const logger = createTimeLogger("GlobalErrorBoundary");

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
  private lastErrorTime: number = 0;
  private readonly ERROR_THROTTLE_MS = 5000;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
    };
    
    log("===== GLOBAL_ERROR_BOUNDARY INITIALIZED =====");
  }

  static getDerivedStateFromError(error: Error): State {
    const timestamp = Date.now();
    console.error(`[${new Date(timestamp).toISOString()}] GLOBAL_ERROR_BOUNDARY: ❌ getDerivedStateFromError:`, error);
    
    return {
      hasError: true,
      error,
      errorCount: 1,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const now = Date.now();
    
    log(`ERROR CAUGHT - Count: ${this.state.errorCount + 1}`);
    console.error(`[${timestamp()}] GLOBAL_ERROR_BOUNDARY: ❌ componentDidCatch:`, error);
    console.error(`[${timestamp()}] GLOBAL_ERROR_BOUNDARY: Error stack:`, error.stack);
    console.error(`[${timestamp()}] GLOBAL_ERROR_BOUNDARY: Component stack:`, errorInfo.componentStack);

    if (now - this.lastErrorTime > this.ERROR_THROTTLE_MS) {
      // ✅ Direct console logs for dev visibility
      console.error("🧨 GlobalErrorBoundary caught an error:", error);
      console.error("📌 Error details:", errorInfo);

      logger.error("GlobalErrorBoundary caught an error", error, errorInfo);
      this.lastErrorTime = now;

      if (this.shouldAttemptRecovery(error)) {
        console.info("🔁 Attempting automatic recovery...");
        logger.info("Attempting automatic recovery...");
        try {
          AppStateRecovery.attemptRecovery();
          log("✅ Recovery attempt completed");
        } catch (recoveryError) {
          console.error(`[${timestamp()}] GLOBAL_ERROR_BOUNDARY: ❌ Recovery failed:`, recoveryError);
        }
      }
    } else {
      console.debug("🕒 Suppressed duplicate error report");
      logger.debug("Suppressed duplicate error report");
    }

    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  shouldAttemptRecovery(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    const stateIssueIndicators = [
      "undefined is not an object",
      "cannot read property",
      "null is not an object",
      "is not a function",
      "is not iterable",
      "is not defined",
    ];

    const shouldRecover = stateIssueIndicators.some((indicator) =>
      errorMessage.includes(indicator)
    );
    
    log(`Should attempt recovery: ${shouldRecover} (error: ${error.message})`);
    return shouldRecover;
  }

  resetErrorBoundary = (): void => {
    log("Resetting error boundary...");
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorCount: 0,
    });
    log("✅ Error boundary reset completed");
  };

  handleDeepRecovery = (): void => {
    log("Starting deep recovery process...");
    
    try {
      AppStateRecovery.attemptRecovery();

      if (!AppStateRecovery.hasRecentlyReloaded()) {
        log("Initiating page reload...");
        AppStateRecovery.forceReload();
      } else {
        log("Multiple reload attempts detected, showing user alert");
        alert(
          "Multiple reload attempts detected. Please try clearing your browser cache and reloading the page manually."
        );
      }
    } catch (recoveryError) {
      console.error(`[${timestamp()}] GLOBAL_ERROR_BOUNDARY: ❌ Deep recovery failed:`, recoveryError);
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      log(`Rendering error fallback (error count: ${this.state.errorCount})`);
      
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
