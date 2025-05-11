
import { useState, useEffect, useCallback } from 'react';
import { useUnifiedTimeEntries } from './useUnifiedTimeEntries';
import { UseUnifiedTimeEntriesOptions, UnifiedTimeEntriesResult } from './types';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useTimeEntriesWithRecovery');

/**
 * Options for the useTimeEntriesWithRecovery hook
 */
export interface TimeEntriesWithRecoveryOptions extends UseUnifiedTimeEntriesOptions {
  /** Maximum number of retries when service fails */
  maxRetries?: number;
  /** Initial delay between retries in ms */
  initialRetryDelay?: number;
  /** Whether to enable service recovery */
  enableRecovery?: boolean;
}

/**
 * Enhanced version of useUnifiedTimeEntries with service recovery capabilities
 * Handles service failures gracefully with automatic retry and backoff
 * 
 * @param {TimeEntriesWithRecoveryOptions} options - Configuration options
 * @returns {UnifiedTimeEntriesResult & { isServiceReady: boolean }} Time entries and service state
 */
export const useTimeEntriesWithRecovery = (
  options: TimeEntriesWithRecoveryOptions = {}
): UnifiedTimeEntriesResult & { isServiceReady: boolean } => {
  const {
    maxRetries = 3,
    initialRetryDelay = 1000,
    enableRecovery = true,
    ...unifiedOptions
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isServiceReady, setIsServiceReady] = useState(true);
  const { toast } = useToast();
  
  // Use the base hook
  const unifiedTimeEntries = useUnifiedTimeEntries(unifiedOptions);
  
  // Check for errors and retry if needed
  useEffect(() => {
    if (unifiedTimeEntries.error) {
      logger.warn(`Time entry service error detected: ${unifiedTimeEntries.error}`);
      
      if (enableRecovery && retryCount < maxRetries) {
        const delay = initialRetryDelay * Math.pow(2, retryCount);
        
        logger.debug(`Scheduling retry ${retryCount + 1}/${maxRetries} in ${delay}ms`);
        
        // If this is the first error, show a toast
        if (retryCount === 0 && options.showToasts) {
          toast({
            title: "Timesheet service issue",
            description: "Attempting to reconnect...",
            duration: 3000
          });
        }
        
        setIsServiceReady(false);
        
        const timeoutId = setTimeout(() => {
          logger.debug(`Executing retry ${retryCount + 1}/${maxRetries}`);
          setRetryCount(prev => prev + 1);
          unifiedTimeEntries.refreshEntries();
        }, delay);
        
        return () => clearTimeout(timeoutId);
      } else if (retryCount >= maxRetries) {
        logger.error(`Time entry service failed after ${maxRetries} retries`);
        
        if (options.showToasts) {
          toast({
            title: "Service unavailable",
            description: "Could not connect to timesheet service. Please try again later.",
            variant: "destructive",
            duration: 5000
          });
        }
      }
    } else {
      // Reset retry count if things are working
      if (retryCount > 0) {
        setRetryCount(0);
        setIsServiceReady(true);
        
        if (options.showToasts) {
          toast({
            title: "Connection restored",
            description: "Timesheet service is now available.",
            duration: 3000
          });
        }
      }
    }
  }, [unifiedTimeEntries.error, retryCount, maxRetries, initialRetryDelay, enableRecovery, options.showToasts]);
  
  // Return combined result
  return {
    ...unifiedTimeEntries,
    isServiceReady
  };
};

export default useTimeEntriesWithRecovery;
