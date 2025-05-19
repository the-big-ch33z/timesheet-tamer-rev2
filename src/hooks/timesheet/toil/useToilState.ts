
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';
import { toilService } from '@/utils/time/services/toil';
import { UseTOILStateProps, UseTOILStateResult } from './types';
import { TOILSummary } from '@/types/toil';

/**
 * Hook to manage TOIL state
 */
export const useToilState = ({
  userId,
  date,
}: UseTOILStateProps): UseTOILStateResult => {
  const logger = useLogger('TOILState');
  const [toilSummary, setToilSummary] = useState<TOILSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Track if this is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);

  // Initialize TOIL summary when component mounts or user/date changes
  useEffect(() => {
    if (!userId || !date) return;
    
    const fetchInitialSummary = async () => {
      try {
        logger.debug(`Fetching initial TOIL summary for ${userId}, ${format(date, 'yyyy-MM')}`);
        const summary = toilService.getTOILSummary(userId, format(date, 'yyyy-MM'));
        
        if (isMountedRef.current) {
          logger.debug(`Setting initial TOIL summary:`, summary);
          setToilSummary(summary);
        }
      } catch (error) {
        logger.error('Error fetching initial TOIL summary:', error);
      }
    };
    
    fetchInitialSummary();
  }, [userId, date, logger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logger.debug('TOIL state hook unmounting');
      isMountedRef.current = false;
    };
  }, [logger]);

  return {
    toilSummary,
    setToilSummary,
    isCalculating,
    setIsCalculating
  };
};
