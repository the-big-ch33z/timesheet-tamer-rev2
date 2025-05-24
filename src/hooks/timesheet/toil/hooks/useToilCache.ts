
import React, { useCallback, useRef } from 'react';
import { TOILSummary } from '@/types/toil';
import { toilService, clearCacheForCurrentMonth } from '@/utils/time/services/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { RateLimiter } from '../utils/toilCalculationUtils';

const logger = createTimeLogger('useToilCache');

export interface UseToilCacheProps {
  userId: string;
  monthYear: string;
  setToilSummary: (summary: TOILSummary | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface UseToilCacheResult {
  loadSummary: () => void;
  refreshSummary: () => void;
}

/**
 * Hook for managing TOIL caching and loading with optimized rate limiting
 */
export function useToilCache({
  userId,
  monthYear,
  setToilSummary,
  setIsLoading,
  setError
}: UseToilCacheProps): UseToilCacheResult {
  const isMountedRef = useRef(true);
  const rateLimiter = useRef(new RateLimiter(300)); // Increased from 150ms to 300ms

  const loadSummary = useCallback(() => {
    if (!isMountedRef.current || !userId) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      logger.debug(`Loading summary for ${userId} in ${monthYear}`);
      
      const result = toilService.getTOILSummary(userId, monthYear);
      
      if (!isMountedRef.current) {
        return;
      }

      const finalSummary = result || { userId, monthYear, accrued: 0, used: 0, remaining: 0 };
      setToilSummary(finalSummary);
      
      logger.debug(`Summary loaded: accrued=${finalSummary.accrued}, used=${finalSummary.used}, remaining=${finalSummary.remaining}`);
      
      setIsLoading(false);
    } catch (err) {
      logger.error(`Error getting summary:`, err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setToilSummary({ userId, monthYear, accrued: 0, used: 0, remaining: 0 });
        setIsLoading(false);
      }
    }
  }, [userId, monthYear, setToilSummary, setIsLoading, setError]);

  const refreshSummary = useCallback(() => {
    if (!isMountedRef.current || !rateLimiter.current.canProceed()) {
      logger.debug(`Refresh skipped - rate limited or unmounted`);
      return;
    }
    
    logger.debug(`Refresh requested for ${userId}`);
    
    // Clear cache for immediate feedback
    clearCacheForCurrentMonth(userId, new Date());
    
    // Trigger reload with debouncing
    setTimeout(() => {
      if (isMountedRef.current) {
        loadSummary();
      }
    }, 100); // Small delay to prevent excessive rapid reloads
  }, [userId, loadSummary]);

  // Cleanup on unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    loadSummary,
    refreshSummary
  };
}
