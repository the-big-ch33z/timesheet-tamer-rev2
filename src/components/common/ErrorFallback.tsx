import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary: () => void;
  deepRecovery?: () => void;
  errorCount?: number;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  deepRecovery,
  errorCount = 1,
}) => {
  const showFullError = errorCount <= 2;

  // ✅ Console logging for visibility
  useEffect(() => {
    if (error) {
      console.error("🚨 ErrorFallback received error:", error);
    }
  }, [error]);

  const handleReset = () => {
    try {
      localStorage.removeItem("error-state");
      localStorage.removeItem("time-entries-cache-timestamp");
    } catch (e) {
      console.error("Error clearing local storage during reset:", e);
    }

    resetErrorBoundary();
  };

  const handleFullReset = () => {
    if (deepRecovery) {
      deepRecovery();
    } else {
      try {
        localStorage.removeItem("time-entries-cache");
        localStorage.removeItem("time-entries-cache-timestamp");
        localStorage.removeItem("error-state");
      } catch (e) {
        console.error("Error during storage cleanup:", e);
      }

      window.location.reload();
    }
  };

  if (!showFullError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Application Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              We encountered a problem loading this content. Reloading the
              page might help resolve this issue.
            </p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 rounded text-xs text-red-800">
                Error: {error.message}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleReset}>
              Try Again
            </Button>
            <Button variant="destructive" onClick={handleFullReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Deep Recovery
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>
        <div className="text-sm space-y-2">
          <p>{error?.message || "An unexpected error occurred"}</p>
          {error?.stack && (
            <details className="text-xs">
              <summary>Technical details</summary>
              <pre className="overflow-auto p-2 bg-red-950/10 rounded mt-1">
                {error.stack.split("\n").slice(0, 5).join("\n")}
              </pre>
            </details>
          )}
          <div className="flex space-x-2 mt-3">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Try Again
            </Button>
            <Button variant="default" size="sm" onClick={handleFullReset}>
              Reload Page
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorFallback;
