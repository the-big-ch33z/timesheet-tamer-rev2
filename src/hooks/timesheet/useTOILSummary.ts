
import { useState, useEffect, useRef, useMemo } from 'react';
import { getSafeTOILSummary } from '@/utils/time/services/toil/storage/getSafeTOILSummary';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

export const useTOILSummary = ({ userId, date }) => {
  const [summary, setSummary] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const isMountedRef = useRef(true);

  const logger = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createTimeLogger('useTOILSummary');
    }
    return null;
  }, []);

  const monthYear = useMemo(() => date.toISOString().slice(0, 7), [date]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!userId || !monthYear) return;

    try {
      const result = getSafeTOILSummary(userId, monthYear);

      if (isMountedRef.current) {
        logger?.debug('Setting TOIL summary:', result);
        setSummary(result);
      }
    } catch (err) {
      logger?.error('TOIL summary loading failed:', err);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [userId, monthYear, refreshCounter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event) => {
      const data = event.detail;
      if (data?.userId === userId && (!data.monthYear || data.monthYear === monthYear)) {
        logger?.debug('[toil:summary-updated] Refreshing...');
        setRefreshCounter(c => c + 1);
      }
    };

    window.addEventListener('toil:summary-updated', handler);

    const subscription = timeEventsService.subscribe('toil-updated', (data) => {
      if (data?.userId === userId && data?.date) {
        logger?.debug('[timeEventsService] TOIL update received — refreshing');
        setTimeout(() => setRefreshCounter(c => c + 1), 10);
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', handler);
      subscription.unsubscribe();
    };
  }, [userId, monthYear]);

  return {
    summary,
    isLoading: false,
    error: null,
    refreshSummary: () => setRefreshCounter(c => c + 1)
  };
};
