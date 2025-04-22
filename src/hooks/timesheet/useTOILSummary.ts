
import { useState, useEffect, useRef } from 'react';
import { TOILSummary } from '@/types/toil';
import { toilService } from '@/utils/time/services/toil';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';
import { getTOILSummary, clearTOILStorageForMonth } from '@/utils/time/services/toil/storage';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useTOILSummary');

export interface UseTOILSummaryProps {
  userId: string;
  date: Date;
}

export interface UseTOILSummaryResult {
  summary: TOILSummary | null;
  isLoading: boolean;
  error: string | null;
  refreshSummary: () => void;
}

export const useTOILSummary = ({ 
  userId, 
  date 
}: UseTOILSummaryProps): UseTOILSummaryResult => {
  const [summary, setSummary] = useState<TOILSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  
  const monthYear = format(date, 'yyyy-MM');
  
  // Clear caches when month changes to ensure we get fresh data
  useEffect(() => {
    toilService.clearCache();
    logger.debug(`Month changed to ${monthYear}, cache cleared`);
  }, [monthYear]);
  
  const loadSummary = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!userId) {
        setError('No user ID provided');
        setIsLoading(false);
        return;
      }
      
      // Use the imported getTOILSummary function instead of accessing it through toilService
      const toilSummary = getTOILSummary(userId, monthYear);
      
      if (isMountedRef.current) {
        setSummary(toilSummary);
        logger.debug(`Loaded TOIL summary for ${userId}, month=${monthYear}:`, toilSummary);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading TOIL summary';
      logger.error(errorMessage);
      
      if (isMountedRef.current) {
        setError(errorMessage);
        
        // Set zeroed summary on error
        setSummary({
          userId,
          monthYear,
          accrued: 0,
          used: 0,
          remaining: 0
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  // Load summary when userId or date changes
  useEffect(() => {
    loadSummary();
  }, [userId, monthYear]);
  
  // Set up isMounted cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Listen for TOIL update events to refresh the summary
  useEffect(() => {
    const handleTOILUpdate = (event: CustomEvent) => {
      if (!isMountedRef.current) return;
      
      const updatedSummary = event.detail as TOILSummary;
      if (updatedSummary.userId === userId && updatedSummary.monthYear === monthYear) {
        logger.debug('Received TOIL update event, refreshing summary');
        setSummary(updatedSummary);
        setIsLoading(false); // Ensure loading state is reset
      }
    };
    
    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    };
  }, [userId, monthYear]);
  
  return {
    summary,
    isLoading,
    error,
    refreshSummary: loadSummary
  };
};
