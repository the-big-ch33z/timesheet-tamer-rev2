
import { useEffect } from 'react';
import { TimeEntry } from '@/types';
import { unifiedTimeEntryService } from '@/utils/time/services/unifiedTimeEntryService';
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
    const saveEntries = async () => {
      try {
        // Filter out entries that might be in the deleted entries list
        const deletedEntryIds = await unifiedTimeEntryService.getDeletedEntryIds();
        const filteredEntries = entries.filter(entry => !deletedEntryIds.includes(entry.id));
        
        if (filteredEntries.length !== entries.length) {
          logger.debug('Filtered out deleted entries', { 
            original: entries.length, 
            filtered: filteredEntries.length 
          });
        }
        
        // Save the filtered entries
        unifiedTimeEntryService.saveEntriesToStorage(filteredEntries);
      } catch (error) {
        logger.error('Error saving entries to storage', error);
      }
    };
    
    saveEntries();
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
};
