
import { useState, useEffect, useRef, useMemo } from 'react';
import { getTOILSummary } from '@/utils/time/services/toil/storage';

export const useTOILSummary = ({ userId, date }) => {
  const [summary, setSummary] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const isMountedRef = useRef(true);

  // Memoize monthYear to prevent unnecessary effect reruns
  const monthYear = useMemo(() => date.toISOString().slice(0, 7), [date]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!userId || !monthYear) return;

    console.log('🔄 TOIL useEffect running:', { userId, monthYear, refreshCounter });

    try {
      const result = getTOILSummary(userId, monthYear);

      if (isMountedRef.current) {
        setSummary(result ?? {
          userId,
          monthYear,
          accrued: 0,
          used: 0,
          remaining: 0
        });
      }
    } catch (err) {
      console.error('TOIL load error:', err);
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
