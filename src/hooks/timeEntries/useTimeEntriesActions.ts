
import { useCallback } from 'react';
import { TimeEntry } from '@/types';
import { unifiedTimeEntryService } from '@/utils/time/services';
import type { TimeEntryEvent } from '@/utils/time/services';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { UnifiedTimeEntriesActions, UseUnifiedTimeEntriesOptions } from './types';

const logger = createTimeLogger('useTimeEntriesActions');

/**
 * Hook to provide CRUD operations for time entries
 */
export const useTimeEntriesActions = (
  options: UseUnifiedTimeEntriesOptions = {}, 
  refreshEntries: () => void
): UnifiedTimeEntriesActions => {
  const { userId, showToasts = true } = options;
  const { toast } = useToast();
  
  // CRUD operations
  const createEntry = useCallback((entryData: Omit<TimeEntry, "id">): string | null => {
    logger.debug('Creating entry:', entryData);
    
    // Make sure userId is set
    const completeEntryData = {
      ...entryData,
      userId: entryData.userId || userId || ''
    };
    
    const result = unifiedTimeEntryService.createEntry(completeEntryData);
    
    if (!result && showToasts) {
      toast({
        title: 'Error adding entry',
        description: 'Could not add entry to your timesheet',
        variant: 'destructive'
      });
    }
    
    return result;
  }, [userId, toast, showToasts]);
  
  const updateEntry = useCallback((entryId: string, updates: Partial<TimeEntry>): boolean => {
    logger.debug('Updating entry:', entryId, updates);
    
    const result = unifiedTimeEntryService.updateEntry(entryId, updates);
    
    if (!result && showToasts) {
      toast({
        title: 'Error updating entry',
        description: 'Could not update your time entry',
        variant: 'destructive'
      });
    }
    
    return result;
  }, [toast, showToasts]);
  
  const deleteEntry = useCallback((entryId: string): boolean => {
    logger.debug('Deleting entry:', entryId);
    
    const result = unifiedTimeEntryService.deleteEntry(entryId);
    
    if (!result && showToasts) {
      toast({
        title: 'Error deleting entry',
        description: 'Could not delete your time entry',
        variant: 'destructive'
      });
    }
    
    return result;
  }, [toast, showToasts]);

  return {
    createEntry,
    updateEntry,
    deleteEntry,
    refreshEntries
  };
};
