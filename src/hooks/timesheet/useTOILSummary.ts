
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getSafeTOILSummary } from '@/utils/time/services/toil/storage/getSafeTOILSummary';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

export const useTOILSummary = ({ userId, date }) => {
  const [summary, setSummary] = useState(null);
  const isMounted = useRef(false);
  const debounceTimeout = useRef(null);
  const lastHash = useRef('');

  const monthYear = useMemo(() => date.toISOString().slice(0, 7), [date]);

  const getHash = (data) => {
    if (!data) return '';
    return \`\${data.userId}-\${data.monthYear}-\${data.accrued}-\${data.used}-\${data.remaining}\`;
  };

  const loadSummary = useCallback(() => {
    if (!userId || !monthYear) return;

    try {
      const result = getSafeTOILSummary(userId, monthYear);
      const newHash = getHash(result);
      if (newHash !== lastHash.current && isMounted.current) {
        console.log('[TOIL] Summary changed, updating state');
        setSummary(result);
        lastHash.current = newHash;
      }
    } catch (error) {
      console.error('[TOIL] Error loading summary:', error);
    }
  }, [userId, monthYear]);

  useEffect(() => {
    isMounted.current = true;
    loadSummary();
    return () => {
      isMounted.current = false;
    };
  }, [loadSummary]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const debouncedRefresh = (label) => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        console.log('[TOIL] Debounced refresh from:', label);
        loadSummary();
      }, 250);
    };

    const domHandler = (e) => {
      const d = e.detail;
      if (d?.userId === userId && (!d.monthYear || d.monthYear === monthYear)) {
        debouncedRefresh('DOM event toil:summary-updated');
      }
    };

    const sub = timeEventsService.subscribe('toil-updated', (d) => {
      if (d?.userId === userId && d?.date) {
        debouncedRefresh('Service event toil-updated');
      }
    });

    window.addEventListener('toil:summary-updated', domHandler);
    return () => {
      window.removeEventListener('toil:summary-updated', domHandler);
      sub.unsubscribe();
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [userId, monthYear, loadSummary]);

  return {
    summary,
    isLoading: false,
    error: null,
    refreshSummary: loadSummary
  };
};
