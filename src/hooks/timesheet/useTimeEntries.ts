
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns'; // Add this import
import { TimeEntry } from '@/types';
import { timeEntryService } from '@/utils/time/services/timeEntryService';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useTimeEntries');

/**
 * Hook for managing time entries with consistent state management
 */
export const useTimeEntries = (userId?: string, date?: Date) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  
  // Load entries when userId or date changes
  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    
    logger.debug(`Loading entries for user ${userId}${date ? ` on ${format(date, 'yyyy-MM-dd')}` : ''}`);
    setIsLoading(true);
    
    try {
      // Get either all user entries or just entries for the specified date
      const loadedEntries = date
        ? timeEntryService.getDayEntries(date, userId)
        : timeEntryService.getUserEntries(userId);
        
      setEntries(loadedEntries);
      logger.debug(`Loaded ${loadedEntries.length} entries`);
    } catch (error) {
      logger.error('Error loading entries:', error);
      toast({
        title: 'Error loading entries',
        description: 'Could not load your time entries',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, date, refreshTrigger, toast]);
  
  // Setup storage event listener for cross-tab synchronization
  useEffect(() => {
    if (!userId) return;
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'timeEntries') {
        logger.debug('Storage change detected, refreshing entries');
        setRefreshTrigger(prev => prev + 1);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userId]);
  
  // Create a new entry
  const createEntry = useCallback((entryData: Omit<TimeEntry, 'id'>): string | null => {
    logger.debug('Creating new entry:', entryData);
    
    const result = timeEntryService.createEntry({
      ...entryData,
      userId: entryData.userId || userId || ''
    });
    
    if (result) {
      // Refresh the entries list
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: 'Entry added',
        description: `Added ${entryData.hours} hours to your timesheet`,
      });
    } else {
      toast({
        title: 'Error adding entry',
        description: 'Could not add entry to your timesheet',
        variant: 'destructive',
      });
    }
    
    return result;
  }, [userId, toast]);
  
  // Update an existing entry
  const updateEntry = useCallback((entryId: string, updates: Partial<TimeEntry>): boolean => {
    logger.debug('Updating entry:', entryId, updates);
    
    const result = timeEntryService.updateEntry(entryId, updates);
    
    if (result) {
      // Refresh the entries list
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: 'Entry updated',
        description: 'Your time entry has been updated',
      });
    } else {
      toast({
        title: 'Error updating entry',
        description: 'Could not update your time entry',
        variant: 'destructive',
      });
    }
    
    return result;
  }, [toast]);
  
  // Delete an entry
  const deleteEntry = useCallback((entryId: string): boolean => {
    logger.debug('Deleting entry:', entryId);
    
    const result = timeEntryService.deleteEntry(entryId);
    
    if (result) {
      // Refresh the entries list
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: 'Entry deleted',
        description: 'Time entry has been removed from your timesheet',
      });
    } else {
      toast({
        title: 'Error deleting entry',
        description: 'Could not delete your time entry',
        variant: 'destructive',
      });
    }
    
    return result;
  }, [toast]);
  
  // Calculate total hours for the current entries
  const calculateTotalHours = useCallback((): number => {
    return timeEntryService.calculateTotalHours(entries);
  }, [entries]);
  
  // Force refresh entries
  const refreshEntries = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    calculateTotalHours,
    refreshEntries
  };
};
