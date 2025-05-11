
import { useState, useEffect, useRef, useCallback } from 'react';
import { TOILSummary } from '@/types/toil';
import { format } from 'date-fns';
import { getTOILSummary, cleanupDuplicateTOILRecords } from '@/utils/time/services/toil/storage';
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
      console.log(`[useTOILSummary] Loading summary for ${userId} in ${monthYear}`);
      const result = getTOILSummary(userId, monthYear);
      if (!isMountedRef.current) return;

      console.log(`[useTOILSummary] Summary result:`, result);
      
      if (!result) {
        setSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
        console.log(`[useTOILSummary] No summary found, using default`);
      } else {
        setSummary(result);
      }
    } catch (err) {
      console.error(`[useTOILSummary] Error getting summary:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, monthYear, refreshCounter]);

  const refreshSummary = useCallback(() => {
    console.log(`[useTOILSummary] Refresh requested for ${userId}`);
    setRefreshCounter(c => c + 1);
  }, [userId]);

  useEffect(() => {
    isMountedRef.current = true;
    loadSummary();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadSummary]);

  useEffect(() => {
    console.log(`[useTOILSummary] Clearing cache for ${userId}`);
    try {
      toilService.clearCache();
    } catch (err) {
      console.error(`[useTOILSummary] Error clearing cache:`, err);
    }
    
    if (userId) {
      console.log(`[useTOILSummary] Cleaning up duplicates for ${userId}`);
      cleanupDuplicateTOILRecords(userId).catch((err) => {
        console.error(`[useTOILSummary] Error cleaning duplicates:`, err);
      });
    }
  }, [userId, monthYear]);

  useEffect(() => {
    const handleTOILUpdate = (event: CustomEvent) => {
      if (!isMountedRef.current) return;
      const data = event.detail;
      console.log(`[useTOILSummary] TOIL update event received:`, data);
      
      const valid = data?.userId === userId && (!data.monthYear || data.monthYear === monthYear);
      if (valid) {
        console.log(`[useTOILSummary] Valid update for current user and month`);
        if (typeof data.accrued === 'number') {
          setSummary({
            userId,
            monthYear: data.monthYear || monthYear,
            accrued: data.accrued,
            used: data.used,
            remaining: data.remaining
          });
          setIsLoading(false);
          console.log(`[useTOILSummary] Updated summary from event data`);
        } else {
          console.log(`[useTOILSummary] No accrued data, refreshing summary`);
          refreshSummary();
        }
      }
    };

    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    console.log(`[useTOILSummary] Added event listener for toil:summary-updated`);
    
    const sub = timeEventsService.subscribe('toil-updated', data => {
      console.log(`[useTOILSummary] toil-updated event received:`, data);
      if (data?.userId === userId && data?.date) {
        console.log(`[useTOILSummary] Refreshing based on toil-updated event`);
        refreshSummary();
      }
    });

    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      sub.unsubscribe();
      console.log(`[useTOILSummary] Removed event listeners`);
    };
  }, [userId, monthYear, refreshSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary
  };
};
