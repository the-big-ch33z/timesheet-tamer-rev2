
import { useState, useEffect, useRef, useMemo } from 'react';
import { getSafeTOILSummary } from '@/utils/time/services/toil/storage/getSafeTOILSummary';

export const useTOILSummary = ({ userId, date }) => {
  const [summary, setSummary] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const isMountedRef = useRef(true);

  const monthYear = useMemo(() => date.toISOString().slice(0, 7), [date]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!userId || !monthYear) return;

    try {
      const result = getSafeTOILSummary(userId, monthYear);
      console.log('[TOIL] Loaded summary:', result);

      if (isMountedRef.current) {
        setSummary(result);
      }
    } catch (err) {
      console.error('[TOIL] Error loading summary:', err);
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
