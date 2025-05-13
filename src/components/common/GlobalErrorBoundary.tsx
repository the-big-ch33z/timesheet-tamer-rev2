import React, { Component, ErrorInfo, ReactNode } from "react";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";
import ErrorFallback from "./ErrorFallback";
import AppStateRecovery from "@/utils/error/errorRecovery";

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
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 1,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const now = Date.now();

    if (now - this.lastErrorTime > this.ERROR_THROTTLE_MS) {
      // ✅ Direct console logs for dev visibility
      console.error("🧨 GlobalErrorBoundary caught an error:", error);
      console.error("📌 Error details:", errorInfo);

      logger.error("GlobalErrorBoundary caught an error", error, errorInfo);
      this.lastErrorTime = now;

      if (this.shouldAttemptRecovery(error)) {
        console.info("🔁 Attempting automatic recovery...");
        logger.info("Attempting automatic recovery...");
        AppStateRecovery.attemptRecovery();
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

    return stateIssueIndicators.some((indicator) =>
      errorMessage.includes(indicator)
    );
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorCount: 0,
    });
  };

  handleDeepRecovery = (): void => {
    AppStateRecovery.attemptRecovery();

    if (!AppStateRecovery.hasRecentlyReloaded()) {
      AppStateRecovery.forceReload();
    } else {
      alert(
        "Multiple reload attempts detected. Please try clearing your browser cache and reloading the page manually."
      );
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
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
