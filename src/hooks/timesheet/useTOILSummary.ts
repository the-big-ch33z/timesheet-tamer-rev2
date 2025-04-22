
import { useState, useEffect } from 'react';
import { TOILSummary } from '@/types/toil';
import { toilService } from '@/utils/time/services/toil';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';
import { getTOILSummary, clearTOILStorageForMonth } from '@/utils/time/services/toil/storage';

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
  const logger = useLogger('TOILSummary');
  const [summary, setSummary] = useState<TOILSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const monthYear = format(date, 'yyyy-MM');
  
  // Clear caches when month changes to ensure we get fresh data
  useEffect(() => {
    toilService.clearCache();
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
      setSummary(toilSummary);
      
      logger.debug(`Loaded TOIL summary for ${userId}, month=${monthYear}:`, toilSummary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading TOIL summary';
      logger.error(errorMessage);
      setError(errorMessage);
      
      // Set zeroed summary on error
      setSummary({
        userId,
        monthYear,
        accrued: 0,
        used: 0,
        remaining: 0
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load summary when userId or date changes
  useEffect(() => {
    loadSummary();
  }, [userId, monthYear]);
  
  // Listen for TOIL update events to refresh the summary
  useEffect(() => {
    const handleTOILUpdate = (event: CustomEvent) => {
      const updatedSummary = event.detail as TOILSummary;
      if (updatedSummary.userId === userId && updatedSummary.monthYear === monthYear) {
        logger.debug('Received TOIL update event, refreshing summary');
        setSummary(updatedSummary);
      }
    };
    
    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    };
  }, [userId, monthYear, logger]);
  
  return {
    summary,
    isLoading,
    error,
    refreshSummary: loadSummary
  };
};
