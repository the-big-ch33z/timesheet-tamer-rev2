
import { useState, useEffect, useRef, useMemo } from 'react';
import { getSafeTOILSummary } from '@/utils/time/services/toil/storage/getSafeTOILSummary';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

function generateSummaryHash(summary) {
  if (!summary) return '';
  return \`\${summary.userId}-\${summary.monthYear}-\${summary.accrued}-\${summary.used}-\${summary.remaining}\`;
}

export const useTOILSummary = ({ userId, date }) => {
  const [summary, setSummary] = useState(null);
  const [summaryHash, setSummaryHash] = useState('');
  const isMountedRef = useRef(true);
  const debounceRef = useRef(null);

  const logger = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createTimeLogger('useTOILSummary');
    }
    return null;
  }, []);

  const monthYear = useMemo(() => date.toISOString().slice(0, 7), [date]);

  const refreshSummary = () => {
    try {
      const result = getSafeTOILSummary(userId, monthYear);
      const newHash = generateSummaryHash(result);

      if (newHash !== summaryHash && isMountedRef.current) {
        logger?.debug('🟢 Setting new TOIL summary:', result);
        setSummary(result);
        setSummaryHash(newHash);
      } else {
        logger?.debug('🔁 TOIL summary unchanged — skipping update.');
      }
    } catch (err) {
      logger?.error('🚨 Error loading TOIL summary:', err);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!userId || !monthYear) return;

    refreshSummary();

    return () => {
      isMountedRef.current = false;
    };
  }, [userId, monthYear]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRefresh = (label) => {
      if (!isMountedRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        logger?.debug(\`🔔 Event triggered refresh: \${label}\`);
        refreshSummary();
      }, 300); // debounce delay
    };

    const domListener = (event) => {
      const data = event.detail;
      if (data?.userId === userId && (!data.monthYear || data.monthYear === monthYear)) {
        handleRefresh('toil:summary-updated');
      }
    };

    window.addEventListener('toil:summary-updated', domListener);

    const subscription = timeEventsService.subscribe('toil-updated', (data) => {
      if (data?.userId === userId && data?.date) {
        handleRefresh('toil-updated service event');
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', domListener);
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [userId, monthYear]);

  return {
    summary,
    isLoading: false,
    error: null,
    refreshSummary
  };
};
