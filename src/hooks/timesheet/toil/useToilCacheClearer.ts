
import { useEffect } from 'react';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';
import { toilService } from '@/utils/time/services/toil';

/**
 * Hook to clear TOIL cache when month changes
 */
export const useToilCacheClearer = (
  date: Date
) => {
  const logger = useLogger('TOILCacheClearer');
  
  // Get the current month-year string
  const currentMonthYear = format(date, 'yyyy-MM');
  
  // Clear caches when month changes
  useEffect(() => {
    logger.debug(`Month changed to ${currentMonthYear}, clearing TOIL cache`);
    toilService.clearCache();
  }, [currentMonthYear, logger]);
};
