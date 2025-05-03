import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TOILSummary } from '@/types/toil';
import { toilService } from '@/utils/time/services/toil';
import { format } from 'date-fns';
import {
  getTOILSummary,
  clearTOILStorageForMonth,
  cleanupDuplicateTOILRecords
} from '@/utils/time/services/toil/storage';
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
  const [summary, setSummary] = useState<TOILSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const isMountedRef = useRef(true);

  const monthYear = format(date, 'yyyy-MM');

  useEffect(() => {
    console.log(`TOIL Summary hook initialized for user ${userId}, month ${monthYear}`);
  }, [userId, monthYear]);

  useEffect(() => {
    toilService.clearCache();
    if (userId) {
      cleanupDuplicateTOILRecords(userId)
        .then(count => {
          if (count > 0) {
            console.log(`Cleaned up ${count} duplicate TOIL records for ${userId}`);
          }
        })
        .catch(err => console.error('Error cleaning up duplicates:', err));
    }
    console.log(`Month changed to ${monthYear}, cache cleared and duplicates cleaned`);
  }, [monthYear, userId]);

  const loadSummary = useCallback(() => {
    if (!userId) {
      console.warn('No userId provided');
      setError('No user ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const toilSummary = getTOILSummary(userId, monthYear);
      if (!isMountedRef.current) return;

      if (!toilSummary) {
        console.warn(`No TOIL summary found for ${userId} in ${monthYear}`);
        setSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
      } else {
        setSummary(toilSummary);
        console.log(`Loaded TOIL summary for ${userId}, month=${monthYear}:`, toilSummary);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading TOIL summary';
      console.error(errorMessage);
      setError(errorMessage);
      setSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, monthYear, refreshCounter]);

  const refreshSummary = useCallback(() => {
    console.log(`Manual refresh requested for ${userId}, month=${monthYear}`);
    setRefreshCounter(prev => prev + 1);
  }, [userId, monthYear]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleTOILUpdate = (event: CustomEvent) => {
      if (!isMountedRef.current) return;
      const eventData = event.detail;
      const isRelevant = eventData?.userId === userId && (!eventData.monthYear || eventData.monthYear === monthYear);

      if (isRelevant) {
        console.log('Received TOIL update event, refreshing summary');

        if (typeof eventData.accrued === 'number') {
          setSummary({
            userId: eventData.userId,
            monthYear: eventData.monthYear || monthYear,
            accrued: eventData.accrued,
            used: eventData.used,
            remaining: eventData.remaining
          });
          setIsLoading(false);
        } else {
          refreshSummary();
        }
      }
    };

    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);

    const subscription = timeEventsService.subscribe('toil-updated', data => {
      console.log('Received toil-updated event via timeEventsService:', data);
      const shouldUpdate = data?.userId === userId && data?.date;
      if (shouldUpdate) {
        refreshSummary();
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      subscription.unsubscribe();
    };
  }, [userId, monthYear, refreshSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary
  };
};
