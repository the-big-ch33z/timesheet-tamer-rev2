
import { useState, useEffect, useRef } from 'react';
import { getTOILSummary } from '@/utils/time/services/toil/storage';

export const useTOILSummary = ({ userId, date }) => {
  const [summary, setSummary] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const isMountedRef = useRef(true);

  const monthYear = date.toISOString().slice(0, 7);

  useEffect(() => {
    isMountedRef.current = true;

    try {
      const result = getTOILSummary(userId, monthYear);

      if (isMountedRef.current) {
        console.log('TOIL summary loaded:', result);
        setSummary(result ?? {
          userId,
          monthYear,
          accrued: 0,
          used: 0,
          remaining: 0
        });
      }
    } catch (err) {
      console.error('Error loading TOIL summary:', err);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [userId, monthYear, refreshCounter]);

  return {
    summary,
    isLoading: false,
    error: null,
    refreshSummary: () => setRefreshCounter(c => c + 1)
  };
};
