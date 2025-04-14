
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { TimeEntry } from '@/types';
import { EntriesContextType } from '../types';
import { timeEntryService } from '@/utils/time/services/timeEntryService';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors';

// Create a logger for the context
const logger = createTimeLogger('EntriesContext');

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

export const useEntriesContext = (): EntriesContextType => {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error('useEntriesContext must be used within an EntriesProvider');
  }
  return context;
};

interface EntriesProviderProps {
  children: ReactNode;
  userId?: string;
}

export const EntriesProvider: React.FC<EntriesProviderProps> = ({ children, userId }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const { toast } = useToast();
  
  // Load initial entries
  useEffect(() => {
    if (!userId) return;
    
    logger.debug(`Loading entries for user: ${userId}`);
    const userEntries = timeEntryService.getUserEntries(userId);
    setEntries(userEntries);
  }, [userId]);
  
  // Setup storage event listener for multi-tab support
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'timeEntries' && userId) {
        logger.debug('Storage change detected, reloading entries');
        const userEntries = timeEntryService.getUserEntries(userId);
        setEntries(userEntries);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userId]);
  
  // Get entries for a specific user
  const getUserEntries = (userIdToFilter?: string): TimeEntry[] => {
    const targetUserId = userIdToFilter || userId;
    if (!targetUserId) {
      logger.warn('No user ID provided for filtering entries');
      return [];
    }
    
    return timeEntryService.getUserEntries(targetUserId);
  };
  
  // Get entries for a specific day
  const getDayEntries = (date: Date, userIdToFilter?: string): TimeEntry[] => {
    const targetUserId = userIdToFilter || userId;
    if (!targetUserId) {
      logger.warn('No user ID provided for filtering day entries');
      return [];
    }
    
    return timeEntryService.getDayEntries(date, targetUserId);
  };
  
  // Create a new entry
  const createEntry = (entryData: Omit<TimeEntry, "id">): string | null => {
    logger.debug('Creating new entry:', entryData);
    
    // Ensure userId is set
    const completeEntryData = {
      ...entryData,
      userId: entryData.userId || userId || ''
    };
    
    const result = timeEntryService.createEntry(completeEntryData);
    
    if (result) {
      // Refresh entries
      if (userId) {
        const userEntries = timeEntryService.getUserEntries(userId);
        setEntries(userEntries);
      }
      
      toast({
        title: 'Entry added',
        description: `Added ${entryData.hours} hours to your timesheet`
      });
      
      return result;
    } else {
      toast({
        title: 'Error adding entry',
        description: 'Could not add entry to your timesheet',
        variant: 'destructive'
      });
      
      return null;
    }
  };
  
  // Delete an entry
  const deleteEntry = (entryId: string): boolean => {
    logger.debug('Deleting entry:', entryId);
    
    const result = timeEntryService.deleteEntry(entryId);
    
    if (result) {
      // Refresh entries
      if (userId) {
        const userEntries = timeEntryService.getUserEntries(userId);
        setEntries(userEntries);
      }
      
      toast({
        title: 'Entry deleted',
        description: 'Time entry has been removed from your timesheet'
      });
      
      return true;
    } else {
      toast({
        title: 'Error deleting entry',
        description: 'Could not delete your time entry',
        variant: 'destructive'
      });
      
      return false;
    }
  };
  
  const value: EntriesContextType = {
    entries,
    getUserEntries,
    getDayEntries,
    createEntry,
    deleteEntry
  };
  
  return (
    <EntriesContext.Provider value={value}>
      {children}
    </EntriesContext.Provider>
  );
};
