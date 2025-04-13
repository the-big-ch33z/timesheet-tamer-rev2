
import { useState, useCallback, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useLogger } from "./useLogger";

export interface ErrorState {
  hasError: boolean;
  message: string | null;
  context?: string;
  timestamp?: Date;
}

export const useErrorHandler = (componentName: string) => {
  const [errorState, setErrorState] = useState<ErrorState>({ 
    hasError: false, 
    message: null 
  });
  const { toast } = useToast();
  const logger = useLogger(componentName);

  const handleError = useCallback((error: unknown, context?: string) => {
    let message: string;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = 'An unknown error occurred';
    }

    logger.error(`Error in ${componentName}${context ? ` (${context})` : ''}`, error);
    
    setErrorState({
      hasError: true,
      message,
      context,
      timestamp: new Date()
    });

    toast({
      variant: "destructive",
      title: "Error",
      description: message,
    });

    return message;
  }, [componentName, toast, logger]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      message: null
    });
  }, []);

  return {
    errorState,
    handleError,
    clearError
  };
};
