import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TOILSummary } from '@/types/toil';
import { toilService } from '@/utils/time/services/toil';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';
import { 
  getTOILSummary, 
  clearTOILStorageForMonth, 
  cleanupDuplicateTOILRecords 
} from '@/utils/time/services/toil/storage';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

export interface UseTOILSummaryProps {
  userId: string;
  date: Date;
  monthOnly?: boolean;
}

export interface UseTOILSummaryResult {
  summary: TOILSummary | null;
  isLoading: boolean;
  error: string | null;
  refreshSummary: () => void;
}

export const useTOILSummary = ({ userId, date, monthOnly = true }: UseTOILSummaryProps): UseTOILSummaryResult => {
  const logger = useMemo(() => createTimeLogger('useTOILSummary'), []);
  const [summary, setSummary] = useState<TOILSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const isMountedRef = useRef(true);

  const monthYear = format(date, 'yyyy-MM');

  useEffect(() => {
    logger.debug(`TOIL Summary hook initialized for user ${userId}, month ${monthYear}`);
  }, [userId, monthYear]);

  useEffect(() => {
    toilService.clearCache();
    if (userId) {
      cleanupDuplicateTOILRecords(userId)
        .then(count => {
          if (count > 0) {
            logger.debug(`Cleaned up ${count} duplicate TOIL records for ${userId}`);
          }
        })
        .catch(err => logger.error('Error cleaning up duplicates:', err));
    }
    logger.debug(`Month changed to ${monthYear}, cache cleared and duplicates cleaned`);
  }, [monthYear, userId]);

  const loadSummary = useCallback(() => {
    try {
      logger.debug(`Loading TOIL summary for ${userId}, month=${monthYear}, attempt=${refreshCounter}`);
      setIsLoading(true);
      setError(null);

      if (!userId) {
        setError('No user ID provided');
        setIsLoading(false);
        return;
      }

      const toilSummary = getTOILSummary(userId, monthYear);

      if (!isMountedRef.current) return;

      if (!toilSummary) {
        logger.warn(`No TOIL summary found for ${userId} in ${monthYear}`);
        setSummary({
          userId,
          monthYear,
          accrued: 0,
          used: 0,
          remaining: 0
        });
        setIsLoading(false); // ✅ fix: stop loading even if summary is empty
        return;
      }

      setSummary(toilSummary);
      logger.debug(`Loaded TOIL summary for ${userId}, month=${monthYear}:`, toilSummary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading TOIL summary';
      logger.error(errorMessage);

      if (isMountedRef.current) {
        setError(errorMessage);
        setSummary({
          userId,
          monthYear,
          accrued: 0,
          used: 0,
          remaining: 0
        });
        setIsLoading(false); // ✅ also ensure loading ends on error
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, monthYear, refreshCounter]);

  const refreshSummary = useCallback(() => {
    logger.debug(`Manual refresh requested for ${userId}, month=${monthYear}`);
    setRefreshCounter(prev => prev + 1);
  }, [userId, monthYear]);

  useEffect(() => {
    loadSummary();
  }, [userId, monthYear, loadSummary, refreshCounter]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleTOILUpdate = (event: CustomEvent) => {
      if (!isMountedRef.current) return;

      const eventData = event.detail;
      const shouldRefresh = eventData?.userId === userId && (!eventData.monthYear || eventData.monthYear === monthYear);

      if (shouldRefresh) {
        logger.debug('Received TOIL update event, refreshing summary');

        if (eventData.accrued !== undefined) {
          setSummary({
            userId: eventData.userId,
            monthYear: eventData.monthYear || monthYear,
            accrued: eventData.accrued,
            used: eventData.used,
            remaining: eventData.remaining
          });
          setIsLoading(false);
        } else {
          loadSummary();
        }
      }
    };

    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);

    const subscription = timeEventsService.subscribe('toil-updated', (data) => {
      logger.debug('Received toil-updated event via timeEventsService:', data);
      if (data?.userId === userId && data?.date) {
        setTimeout(() => loadSummary(), 10);
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      subscription.unsubscribe();
    };
  }, [userId, monthYear, loadSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary
  };
};
