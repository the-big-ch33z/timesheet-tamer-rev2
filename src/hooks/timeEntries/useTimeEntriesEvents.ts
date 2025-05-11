
import { useEffect, useCallback } from 'react';
import { unifiedTimeEntryService } from '@/utils/time/services';
import type { TimeEntryEvent } from '@/utils/time/services';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { UseUnifiedTimeEntriesOptions } from './types';

const logger = createTimeLogger('useTimeEntriesEvents');

/**
 * Hook to handle time entry events
 */
export const useTimeEntriesEvents = (
  options: UseUnifiedTimeEntriesOptions = {},
  loadEntries: () => void
): void => {
  const { userId, showToasts = true } = options;
  const { toast } = useToast();
  
  // Handle events from the service
  const handleServiceEvent = useCallback((event: TimeEntryEvent) => {
    // Skip if no userId provided (nothing to filter by)
    if (!userId) return;
    
    logger.debug(`Received ${event.type} event`);
    
    switch (event.type) {
      case 'entry-created':
        if (event.userId === userId) {
          loadEntries();
          if (showToasts) {
            toast({
              title: 'Entry added',
              description: 'A new time entry has been added to your timesheet'
            });
          }
        }
        break;
        
      case 'entry-updated':
        if (event.userId === userId) {
          loadEntries();
          if (showToasts) {
            toast({
              title: 'Entry updated',
              description: 'Your time entry has been updated'
            });
          }
        }
        break;
        
      case 'entry-deleted':
        if (event.userId === userId) {
          loadEntries();
          if (showToasts) {
            toast({
              title: 'Entry deleted',
              description: 'A time entry has been removed from your timesheet'
            });
          }
        }
        break;
        
      case 'storage-sync':
        // Always reload on storage sync
        loadEntries();
        break;
        
      case 'error':
        if (showToasts) {
          toast({
            title: 'Error',
            description: `An error occurred: ${event.payload?.error || 'Unknown error'}`,
            variant: 'destructive'
          });
        }
        break;
    }
  }, [userId, loadEntries, toast, showToasts]);

  // Set up event listeners
  useEffect(() => {
    // Subscribe to events using our unified service
    const unsubEntryCreated = unifiedTimeEntryService.addEventListener('entry-created', handleServiceEvent);
    const unsubEntryUpdated = unifiedTimeEntryService.addEventListener('entry-updated', handleServiceEvent);
    const unsubEntryDeleted = unifiedTimeEntryService.addEventListener('entry-deleted', handleServiceEvent);
    const unsubStorageSync = unifiedTimeEntryService.addEventListener('storage-sync', handleServiceEvent);
    const unsubError = unifiedTimeEntryService.addEventListener('error', handleServiceEvent);
    
    // Cleanup
    return () => {
      unsubEntryCreated();
      unsubEntryUpdated();
      unsubEntryDeleted();
      unsubStorageSync();
      unsubError();
    };
  }, [handleServiceEvent]);
};

