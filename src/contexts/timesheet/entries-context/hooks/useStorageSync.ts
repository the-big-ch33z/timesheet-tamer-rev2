
import { useEffect } from 'react';
import { TimeEntry } from '@/types';
import { unifiedTimeEntryService } from '@/utils/time/services';
import { useLogger } from '@/hooks/useLogger';

/**
 * Hook for syncing entries to storage
 */
export const useStorageSync = (
  entries: TimeEntry[],
  isInitialized: boolean,
  isLoading: boolean
) => {
  const logger = useLogger('useStorageSync');

  // Save entries to storage whenever they change
  useEffect(() => {
    // Skip initial render and when loading
    if (!isInitialized || isLoading) return;
    
    logger.debug('Syncing entries to storage', { count: entries.length });
    
    // Use the unified service to save entries
    unifiedTimeEntryService.saveEntriesToStorage(entries);
  }, [entries, isInitialized, isLoading]);
  
  // Set up listener for global save events
  useEffect(() => {
    const handleSaveEvent = () => {
      if (!isInitialized) return;
      
      logger.debug('Received global save event, syncing entries to storage');
      
      // Use unified service to save entries
      unifiedTimeEntryService.saveEntriesToStorage(entries);
    };
    
    window.addEventListener('timesheet:save-pending-changes', handleSaveEvent);
    
    return () => {
      window.removeEventListener('timesheet:save-pending-changes', handleSaveEvent);
    };
  }, [entries, isInitialized]);
  
  // Set up listener for delete events
  useEffect(() => {
    const handleDeleteEvent = (event: CustomEvent<{ entryId: string }>) => {
      const entryId = event.detail?.entryId;
      logger.debug('Entry deletion event detected:', entryId);
      
      if (entryId) {
        // Use the unified service for deletion
        unifiedTimeEntryService.deleteEntryFromStorage(entryId);
      }
    };
    
    window.addEventListener('timesheet:entry-deleted', handleDeleteEvent as EventListener);
    
    return () => {
      window.removeEventListener('timesheet:entry-deleted', handleDeleteEvent as EventListener);
    };
  }, []);
};
