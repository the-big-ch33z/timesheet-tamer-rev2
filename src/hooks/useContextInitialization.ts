
import { useState, useEffect, useCallback } from 'react';
import { useLogger } from './useLogger';
import { useToast } from './use-toast';

export type InitializationStatus = 
  | 'idle'     // Not yet started
  | 'loading'  // In progress
  | 'ready'    // Successfully initialized
  | 'error';   // Initialization failed

export interface InitializationState<T = any> {
  status: InitializationStatus;
  error: Error | null;
  data: T | null;
  isInitialized: boolean;
}

export interface InitializationOptions {
  showToasts?: boolean;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for standardized context initialization
 * 
 * @param initializerFn - Async function that performs initialization
 * @param contextName - Name of the context (for logging)
 * @param options - Initialization options
 */
export function useContextInitialization<T = any>(
  initializerFn: () => Promise<T>,
  contextName: string,
  options: InitializationOptions = {}
) {
  const {
    showToasts = true,
    timeout = 10000,
    maxRetries = 2,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<InitializationState<T>>({
    status: 'idle',
    error: null,
    data: null,
    isInitialized: false
  });

  const logger = useLogger(`${contextName}Initialization`);
  const { toast } = useToast();
  const [retries, setRetries] = useState(0);

  // Initialization function with timeout handling
  const initializeWithTimeout = useCallback(async () => {
    logger.debug(`Initializing ${contextName}...`);
    setState(prev => ({ ...prev, status: 'loading' }));

    let timeoutId: NodeJS.Timeout | undefined;

    try {
      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${contextName} initialization timed out after ${timeout}ms`));
        }, timeout);
      });

      // Race the initialization against the timeout
      const result = await Promise.race([initializerFn(), timeoutPromise]);
      
      // Clear timeout if initialization completed successfully
      clearTimeout(timeoutId);
      
      logger.debug(`${contextName} initialized successfully`);
      setState({
        status: 'ready',
        error: null,
        data: result,
        isInitialized: true
      });
      
      if (onSuccess) onSuccess();
      
      return result;
    } catch (error) {
      // Clear timeout if initialization failed
      if (timeoutId) clearTimeout(timeoutId);
      
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`${contextName} initialization failed:`, err);
      
      setState({
        status: 'error',
        error: err,
        data: null,
        isInitialized: false
      });
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: `${contextName} Error`,
          description: `Could not initialize ${contextName.toLowerCase()}: ${err.message}`
        });
      }
      
      if (onError) onError(err);
      
      throw err;
    }
  }, [initializerFn, contextName, timeout, logger, toast, showToasts, onSuccess, onError]);

  // Initialization with retry logic
  const initialize = useCallback(async () => {
    try {
      return await initializeWithTimeout();
    } catch (error) {
      // Attempt retry if we haven't exceeded the maximum
      if (retries < maxRetries) {
        logger.debug(`Retrying ${contextName} initialization (${retries + 1}/${maxRetries})...`);
        setRetries(prev => prev + 1);
        
        // Schedule retry after delay
        setTimeout(() => {
          initialize().catch(e => {
            logger.error(`Retry ${retries + 1}/${maxRetries} failed:`, e);
          });
        }, retryDelay * Math.pow(2, retries)); // Exponential backoff
      }
      
      // Re-throw to indicate initialization is still not successful
      throw error;
    }
  }, [initializeWithTimeout, retries, maxRetries, retryDelay, contextName, logger]);

  // Reset state and retries
  const reset = useCallback(() => {
    setRetries(0);
    setState({
      status: 'idle',
      error: null,
      data: null,
      isInitialized: false
    });
    
    logger.debug(`${contextName} initialization state reset`);
  }, [contextName, logger]);

  return {
    ...state,
    initialize,
    reset,
    retries
  };
}
