import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeEntry } from '@/types';
import { unifiedTimeEntryService, TimeEntryEvent } from '@/utils/time/services/unifiedTimeEntryService';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useUnifiedTimeEntries');

export interface UseUnifiedTimeEntriesOptions {
  userId?: string;
  date?: Date;
  showToasts?: boolean;
}

/**
 * React hook for using the unified time entry service.
 * Provides reactive access to time entries with automatic updates.
 */
export const useUnifiedTimeEntries = (options: UseUnifiedTimeEntriesOptions = {}) => {
  const { userId, date, showToasts = true } = options;
  
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Keep track of mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Load entries based on the options
  const loadEntries = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let loadedEntries: TimeEntry[] = [];
      
      if (date && userId) {
        // Get entries for a specific day and user
        loadedEntries = unifiedTimeEntryService.getDayEntries(date, userId);
        logger.debug(`Loaded ${loadedEntries.length} entries for user ${userId} on ${date.toDateString()}`);
      } else if (userId) {
        // Get all entries for a user
        loadedEntries = unifiedTimeEntryService.getUserEntries(userId);
        logger.debug(`Loaded ${loadedEntries.length} entries for user ${userId}`);
      } else {
        // Get all entries
        loadedEntries = unifiedTimeEntryService.getAllEntries();
        logger.debug(`Loaded ${loadedEntries.length} entries`);
      }
      
      if (isMountedRef.current) {
        setEntries(loadedEntries);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error loading entries';
      logger.error('Error loading entries:', errorMessage);
      
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, date]);
  
  // Handle events from the service
  const handleServiceEvent = useCallback((event: TimeEntryEvent) => {
    // Check if we're still mounted
    if (!isMountedRef.current) return;
    
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
        if (isMountedRef.current) {
          setError(event.payload?.error || 'Unknown error');
        }
        break;
    }
  }, [userId, loadEntries, toast, showToasts]);
  
  // Initial load and event subscription
  useEffect(() => {
    // Mark as mounted
    isMountedRef.current = true;
    
    // Initial load
    loadEntries();
    
    // Subscribe to events
    const unsubEntryCreated = unifiedTimeEntryService.addEventListener('entry-created', handleServiceEvent);
    const unsubEntryUpdated = unifiedTimeEntryService.addEventListener('entry-updated', handleServiceEvent);
    const unsubEntryDeleted = unifiedTimeEntryService.addEventListener('entry-deleted', handleServiceEvent);
    const unsubStorageSync = unifiedTimeEntryService.addEventListener('storage-sync', handleServiceEvent);
    const unsubError = unifiedTimeEntryService.addEventListener('error', handleServiceEvent);
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      unsubEntryCreated();
      unsubEntryUpdated();
      unsubEntryDeleted();
      unsubStorageSync();
      unsubError();
    };
  }, [loadEntries, handleServiceEvent]);
  
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
  
  // Helper functions
  const getDayEntries = useCallback((day: Date, userIdOverride?: string): TimeEntry[] => {
    const targetUserId = userIdOverride || userId;
    if (!targetUserId) {
      logger.warn('No user ID provided for filtering day entries');
      return [];
    }
    
    return unifiedTimeEntryService.getDayEntries(day, targetUserId);
  }, [userId]);
  
  const getMonthEntries = useCallback((month: Date, userIdOverride?: string): TimeEntry[] => {
    const targetUserId = userIdOverride || userId;
    if (!targetUserId) {
      logger.warn('No user ID provided for filtering month entries');
      return [];
    }
    
    return unifiedTimeEntryService.getMonthEntries(month, targetUserId);
  }, [userId]);
  
  const calculateTotalHours = useCallback((entriesToCalculate?: TimeEntry[]): number => {
    const entriesToUse = entriesToCalculate || entries;
    return unifiedTimeEntryService.calculateTotalHours(entriesToUse);
  }, [entries]);
  
  const refreshEntries = useCallback(() => {
    loadEntries();
  }, [loadEntries]);
  
  return {
    entries,
    isLoading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    getDayEntries,
    getMonthEntries,
    calculateTotalHours,
    refreshEntries
  };
};
