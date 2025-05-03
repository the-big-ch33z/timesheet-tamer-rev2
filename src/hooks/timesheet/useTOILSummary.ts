
import { useState, useEffect } from 'react';
import { getTOILSummary } from '@/utils/time/services/toil/storage';

export const useTOILSummary = ({ userId, date }) => {
  const [summary, setSummary] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const monthYear = date.toISOString().slice(0, 7); // 'YYYY-MM'

  useEffect(() => {
    const result = getTOILSummary(userId, monthYear);
    setSummary(result ?? {
      userId,
      monthYear,
      accrued: 0,
      used: 0,
      remaining: 0
    });
  }, [userId, monthYear, refreshCounter]);

  return {
    summary,
    isLoading: false,
    error: null,
    refreshSummary: () => setRefreshCounter(c => c + 1)
  };
};
