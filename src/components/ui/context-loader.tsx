
import React from "react";
import { Loader2 } from "lucide-react";
import { InitializationStatus } from "@/hooks/useContextInitialization";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface ContextLoaderProps {
  status: InitializationStatus;
  contextName: string;
  errorMessage?: string;
  retry?: () => void;
  children: React.ReactNode;
}

/**
 * Standard loader component for context initialization states
 */
export const ContextLoader: React.FC<ContextLoaderProps> = ({
  status,
  contextName,
  errorMessage,
  retry,
  children,
}) => {
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading {contextName.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>
          {contextName} Error
        </AlertTitle>
        <AlertDescription className="space-y-4">
          <div>{errorMessage || `There was a problem loading the ${contextName.toLowerCase()}.`}</div>
          {retry && (
            <Button
              variant="outline"
              size="sm"
              onClick={retry}
              className="mt-2"
            >
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'idle') {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Preparing {contextName.toLowerCase()}...
      </div>
    );
  }

  // Status is 'ready'
  return <>{children}</>;
};
