
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLogger } from '@/hooks/useLogger';
import { eventBus } from '@/utils/events/EventBus';
import { SYSTEM_EVENTS } from '@/utils/events/eventTypes';

export interface ErrorDetails {
  message: string;
  context?: string;
  timestamp: Date;
  errorId: string;
  recoverable: boolean;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface ErrorState {
  hasError: boolean;
  errors: ErrorDetails[];
  lastError?: ErrorDetails;
}

export interface ErrorContextType extends ErrorState {
  handleError: (error: Error | string, context?: string, metadata?: Record<string, any>) => void;
  clearErrors: () => void;
  clearError: (errorId: string) => void;
  recoverableError: (error: Error | string, context?: string, metadata?: Record<string, any>) => void;
  fatalError: (error: Error | string, context?: string, metadata?: Record<string, any>) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export interface ErrorProviderProps {
  children: ReactNode;
  showToasts?: boolean;
}

/**
 * Error Context Provider
 * Provides centralized error handling and reporting functionality
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  showToasts = true 
}) => {
  const [state, setState] = useState<ErrorState>({
    hasError: false,
    errors: []
  });
  
  const { toast } = useToast();
  const logger = useLogger('ErrorContext');
  
  // Generate a unique ID for each error
  const generateErrorId = useCallback(() => {
    return `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);
  
  // Handle a new error
  const handleError = useCallback((
    error: Error | string, 
    context?: string,
    metadata?: Record<string, any>
  ) => {
    const message = error instanceof Error ? error.message : error;
    const errorObj = error instanceof Error ? error : new Error(message);
    const timestamp = new Date();
    const errorId = generateErrorId();
    
    logger.error(`Error in ${context || 'unknown'}:`, errorObj, metadata);
    
    const errorDetails: ErrorDetails = {
      message,
      context,
      timestamp,
      errorId,
      recoverable: true, // Default to recoverable
      error: errorObj,
      metadata
    };
    
    setState(prev => ({
      hasError: true,
      errors: [...prev.errors, errorDetails],
      lastError: errorDetails
    }));
    
    // Show toast if enabled
    if (showToasts) {
      toast({
        variant: "destructive",
        title: `Error${context ? ` in ${context}` : ''}`,
        description: message
      });
    }
    
    // Publish error event
    eventBus.publish(SYSTEM_EVENTS.ERROR, {
      error: errorObj,
      context,
      metadata,
      timestamp: timestamp.getTime()
    });
    
    return errorDetails;
  }, [generateErrorId, logger, showToasts, toast]);
  
  // Handle a recoverable error (one that doesn't require app restart)
  const recoverableError = useCallback((
    error: Error | string, 
    context?: string,
    metadata?: Record<string, any>
  ) => {
    const errorDetails = handleError(error, context, metadata);
    return errorDetails;
  }, [handleError]);
  
  // Handle a fatal error (requires app restart)
  const fatalError = useCallback((
    error: Error | string, 
    context?: string,
    metadata?: Record<string, any>
  ) => {
    const message = error instanceof Error ? error.message : error;
    const errorObj = error instanceof Error ? error : new Error(message);
    const timestamp = new Date();
    const errorId = generateErrorId();
    
    logger.error(`FATAL ERROR in ${context || 'unknown'}:`, errorObj, metadata);
    
    const errorDetails: ErrorDetails = {
      message,
      context,
      timestamp,
      errorId,
      recoverable: false,
      error: errorObj,
      metadata
    };
    
    setState(prev => ({
      hasError: true,
      errors: [...prev.errors, errorDetails],
      lastError: errorDetails
    }));
    
    // Show toast for fatal error
    if (showToasts) {
      toast({
        variant: "destructive",
        title: `Fatal Error${context ? ` in ${context}` : ''}`,
        description: `${message} - Please refresh the page.`
      });
    }
    
    // Publish fatal error event
    eventBus.publish(SYSTEM_EVENTS.ERROR, {
      error: errorObj,
      context,
      metadata,
      timestamp: timestamp.getTime(),
      fatal: true
    });
    
    return errorDetails;
  }, [generateErrorId, logger, showToasts, toast]);
  
  // Clear a specific error by ID
  const clearError = useCallback((errorId: string) => {
    setState(prev => {
      const filteredErrors = prev.errors.filter(e => e.errorId !== errorId);
      const hasError = filteredErrors.length > 0;
      const lastError = hasError ? filteredErrors[filteredErrors.length - 1] : undefined;
      
      return {
        hasError,
        errors: filteredErrors,
        lastError
      };
    });
  }, []);
  
  // Clear all errors
  const clearErrors = useCallback(() => {
    setState({
      hasError: false,
      errors: []
    });
    
    logger.debug('All errors cleared');
  }, [logger]);
  
  const contextValue: ErrorContextType = {
    ...state,
    handleError,
    clearErrors,
    clearError,
    recoverableError,
    fatalError
  };
  
  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

/**
 * Hook for accessing the error context
 */
export const useErrorContext = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  
  return context;
};

/**
 * Higher-order component to wrap components with error handling
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  return (props: P) => {
    const { handleError } = useErrorContext();
    
    const wrappedProps = {
      ...props,
      onError: (error: Error | string, context?: string) => {
        return handleError(error, `${componentName}${context ? ` - ${context}` : ''}`);
      }
    };
    
    return <Component {...wrappedProps} />;
  };
}
