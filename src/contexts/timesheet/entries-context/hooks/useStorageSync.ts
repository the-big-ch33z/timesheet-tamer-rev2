
import { useEffect } from 'react';
import { TimeEntry } from '@/types';
import { saveEntriesToStorage } from '../timeEntryStorage';
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
    saveEntriesToStorage(entries, isInitialized);
    
  }, [entries, isInitialized, isLoading]);
  
  // Set up listener for global save events
  useEffect(() => {
    const handleSaveEvent = () => {
      if (!isInitialized) return;
      
      logger.debug('Received global save event, syncing entries to storage');
      saveEntriesToStorage(entries, isInitialized);
    };
    
    window.addEventListener('timesheet:save-pending-changes', handleSaveEvent);
    
    return () => {
      window.removeEventListener('timesheet:save-pending-changes', handleSaveEvent);
    };
  }, [entries, isInitialized]);
};
