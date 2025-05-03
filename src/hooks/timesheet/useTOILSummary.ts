
import { useState, useEffect, useRef, useCallback } from 'react';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { getTOILSummary } from '@/utils/time/services/toil/storage';
import { cleanupDuplicateTOILRecords } from '@/utils/time/services/toil/storage';
import { toilService } from '@/utils/time/services/toil';
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

export const useTOILSummary = ({
  userId,
  date,
  monthOnly = true
}: UseTOILSummaryProps): UseTOILSummaryResult => {
  const [summary, setSummary] = useState<TOILSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const isMountedRef = useRef(true);

  const monthYear = format(date, 'yyyy-MM');

  const loadSummary = useCallback(() => {
    if (!userId) {
      setError('No user ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = getTOILSummary(userId, monthYear);
      if (!isMountedRef.current) return;

      if (!result) {
        setSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
      } else {
        setSummary(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, monthYear, refreshCounter]);

  const refreshSummary = useCallback(() => {
    setRefreshCounter(c => c + 1);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadSummary();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadSummary]);

  useEffect(() => {
    toilService.clearCache();
    if (userId) {
      cleanupDuplicateTOILRecords(userId).catch(() => {});
    }
  }, [userId, monthYear]);

  useEffect(() => {
    const handleTOILUpdate = (event: CustomEvent) => {
      if (!isMountedRef.current) return;
      const data = event.detail;
      const valid = data?.userId === userId && (!data.monthYear || data.monthYear === monthYear);
      if (valid) {
        if (typeof data.accrued === 'number') {
          setSummary({
            userId,
            monthYear: data.monthYear || monthYear,
            accrued: data.accrued,
            used: data.used,
            remaining: data.remaining
          });
          setIsLoading(false);
        } else {
          refreshSummary();
        }
      }
    };

    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);

    const sub = timeEventsService.subscribe('toil-updated', data => {
      if (data?.userId === userId && data?.date) {
        refreshSummary();
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      sub.unsubscribe();
    };
  }, [userId, monthYear, refreshSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary
  };
};
