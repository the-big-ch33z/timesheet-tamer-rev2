
import { useState, useEffect, useRef } from 'react';
import { TOILSummary } from '@/types/toil';
import { toilService } from '@/utils/time/services/toil';
import { format } from 'date-fns';
import { useLogger } from '@/hooks/useLogger';
import { 
  getTOILSummary, 
  clearTOILStorageForMonth, 
  cleanupDuplicateTOILRecords 
} from '@/utils/time/services/toil/storage';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const logger = createTimeLogger('useTOILSummary');

export interface UseTOILSummaryProps {
  userId: string;
  date: Date;
  monthOnly?: boolean; // New flag to indicate we only care about the month
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
  monthOnly = true // Default to month-only mode
}: UseTOILSummaryProps): UseTOILSummaryResult => {
  const [summary, setSummary] = useState<TOILSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  
  // Extract just the year and month for monthly view
  // This ensures we don't re-fetch data when only the day changes
  const monthYear = format(date, 'yyyy-MM');
  
  // Clear caches when month changes to ensure we get fresh data
  // UPDATED: Added cleanup call to fix duplicate records
  useEffect(() => {
    toilService.clearCache();
    // New: cleanup duplicate TOIL records when month changes
    if (userId) {
      cleanupDuplicateTOILRecords(userId)
        .then(count => {
          if (count > 0) {
            logger.debug(`Cleaned up ${count} duplicate TOIL records for ${userId}`);
          }
        })
        .catch(err => logger.error('Error cleaning up duplicates:', err));
    }
    logger.debug(`Month changed to ${monthYear}, cache cleared and duplicates cleaned`);
  }, [monthYear, userId]);
  
  const loadSummary = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!userId) {
        setError('No user ID provided');
        setIsLoading(false);
        return;
      }
      
      // Use the improved getTOILSummary function
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
  
  // Load summary when userId or month changes - now only depends on monthYear, not the full date
  useEffect(() => {
    loadSummary();
  }, [userId, monthYear]);
  
  // Set up isMounted cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Listen for TOIL update events to refresh the summary - IMPROVED immediate response
  useEffect(() => {
    const handleTOILUpdate = (event: CustomEvent) => {
      if (!isMountedRef.current) return;
      
      const eventData = event.detail;
      const shouldRefresh = eventData?.userId === userId && (!eventData.monthYear || eventData.monthYear === monthYear);
      
      if (shouldRefresh) {
        logger.debug('Received TOIL update event, refreshing summary');
        
        // If we have a complete summary in the event, use it directly for immediate update
        if (eventData.accrued !== undefined) {
          setSummary({
            userId: eventData.userId,
            monthYear: eventData.monthYear || monthYear,
            accrued: eventData.accrued,
            used: eventData.used,
            remaining: eventData.remaining
          });
          setIsLoading(false);
        } else {
          // Otherwise reload from storage
          loadSummary();
        }
      }
    };
    
    // Listen for both traditional events and the timeEventsService events
    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    // More responsive event handling for immediate UI updates
    const subscription = timeEventsService.subscribe('toil-updated', (data) => {
      logger.debug('Received toil-updated event via timeEventsService:', data);
      
      // Handle direct updates from TOIL usage or creation
      if (data?.userId === userId && data?.date) {
        // Force immediate refresh
        setTimeout(() => loadSummary(), 10); 
      }
    });
    
    return () => {
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
      subscription.unsubscribe();
    };
  }, [userId, monthYear]);
  
  return {
    summary,
    isLoading,
    error,
    refreshSummary: loadSummary
  };
};
