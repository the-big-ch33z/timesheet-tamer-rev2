
import { useState, useEffect } from 'react';
import { useUnifiedTimeEntries } from './useUnifiedTimeEntries';
import { UseUnifiedTimeEntriesOptions, UnifiedTimeEntriesResult } from './types';
import { initializeService } from '@/utils/time/services/api-wrapper';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useTimeEntriesWithRecovery');

/**
 * Enhanced hook with initialization and recovery
 */
export const useTimeEntriesWithRecovery = (
  options: UseUnifiedTimeEntriesOptions = {}
): UnifiedTimeEntriesResult & { isServiceReady: boolean } => {
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Try to initialize the service first
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        await initializeService();
        if (mounted) {
          setIsServiceReady(true);
        }
      } catch (error) {
        logger.error('Service initialization failed:', error);
        if (mounted) {
          setInitError(error instanceof Error ? error : new Error('Unknown error'));
          
          // Show toast only if showToasts is enabled
          if (options.showToasts !== false) {
            toast({
              title: 'Service Error',
              description: 'Failed to load timesheet data. Please refresh the page.',
              variant: 'destructive'
            });
          }
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, [options.showToasts, toast]);
  
  // If initialization fails, use a fallback
  if (initError) {
    // Return a stub result with empty arrays and no-op functions
    return {
      entries: [],
      isLoading: false,
      error: initError.message,
      isServiceReady: false,
      createEntry: () => null,
      updateEntry: () => false,
      deleteEntry: async () => false,
      getDayEntries: () => [],
      getMonthEntries: () => [],
      calculateTotalHours: () => 0,
      refreshEntries: () => {}
    };
  }
  
  // Use the regular hook but only once service is ready
  const entriesResult = useUnifiedTimeEntries(options);
  
  return {
    ...entriesResult,
    isServiceReady
  };
};

export default useTimeEntriesWithRecovery;
