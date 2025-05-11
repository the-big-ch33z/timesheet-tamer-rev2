
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { TimeEntry } from '@/types';
import { useInitialEntries } from './hooks/useInitialEntries';
import { useEntryOperations } from './hooks/useEntryOperations';
import { useEntryQueries } from './hooks/useEntryQueries';
import { useStorageSync } from './hooks/useStorageSync';
import { createTimeLogger } from '@/utils/time/errors';
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS } from '@/utils/events/eventTypes';
import { BaseContextProvider, BaseContextState, createBaseContextType } from '@/contexts/base/BaseContext';
import { useErrorContext } from '@/contexts/error/ErrorContext';
import { ContextLoader } from '@/components/ui/context-loader';

const logger = createTimeLogger('TimeEntryContext');

export interface TimeEntryContextType extends BaseContextState {
  // Data
  entries: TimeEntry[];
  dayEntries: TimeEntry[];
  isLoading: boolean;
  
  // Queries
  getDayEntries: (date: Date) => TimeEntry[];
  getMonthEntries: (date: Date, userId?: string) => TimeEntry[];
  calculateTotalHours: (entries?: TimeEntry[]) => number;
  
  // Operations
  addEntry: (entry: TimeEntry) => void;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => Promise<boolean>;
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
}

export interface TimeEntryProviderProps {
  children: React.ReactNode;
  selectedDate?: Date | null;
  userId?: string;
}

// Create the context with base context functionality
const TimeEntryContext = createBaseContextType<Omit<TimeEntryContextType, keyof BaseContextState>>();

/**
 * TimeEntryProvider
 * 
 * Provides access to time entries and operations to manipulate them
 */
export const TimeEntryProvider: React.FC<TimeEntryProviderProps> = ({ 
  children, 
  selectedDate, 
  userId 
}) => {
  const { handleError } = useErrorContext();
  
  // Initialization function for the context
  const initializeEntries = useCallback(async () => {
    try {
      // This is where we would do any async initialization
      logger.debug("Initializing time entry service");
      return true; // Return success
    } catch (error) {
      logger.error("Failed to initialize time entry service:", error);
      throw error;
    }
  }, []);

  // Load initial entries and get state management
  const { entries, setEntries, isLoading, isInitialized } = useInitialEntries();
  
  // Set up storage synchronization
  useStorageSync(entries, isInitialized, isLoading);
  
  // Set up operations and queries
  const { addEntry, updateEntry, deleteEntry, createEntry } = useEntryOperations(entries, setEntries);
  const { getDayEntries, getMonthEntries, calculateTotalHours } = useEntryQueries(entries, userId);
  
  // Get entries for the current day
  const dayEntries = useMemo(() => {
    return selectedDate ? getDayEntries(selectedDate) : [];
  }, [selectedDate, getDayEntries]);
  
  // Log when selectedDate changes to track updates
  React.useEffect(() => {
    if (selectedDate) {
      logger.debug(`Selected date in TimeEntryProvider: ${selectedDate.toISOString()}, entries: ${dayEntries.length}`);
      
      // Notify subscribers of day entries change
      eventBus.publish(TIME_ENTRY_EVENTS.LOADED, {
        date: selectedDate,
        userId: userId,
        entries: dayEntries
      });
    }
  }, [selectedDate, dayEntries.length, userId]);

  return (
    <BaseContextProvider
      contextName="TimeEntry"
      initializer={initializeEntries}
      autoInitialize={true}
    >
      {(baseContext: BaseContextState) => (
        <ContextLoader
          status={baseContext.status}
          contextName="Time Entries"
          retry={baseContext.initialize}
        >
          <TimeEntryContext.Provider 
            value={{
              // Base context props
              ...baseContext,
              
              // Data
              entries,
              dayEntries,
              isLoading,
              
              // Queries
              getDayEntries,
              getMonthEntries,
              calculateTotalHours,
              
              // Operations
              addEntry,
              updateEntry,
              deleteEntry,
              createEntry
            }}
          >
            {children}
          </TimeEntryContext.Provider>
        </ContextLoader>
      )}
    </BaseContextProvider>
  );
};

/**
 * Hook to access time entry data and operations
 */
export const useTimeEntryContext = (): TimeEntryContextType => {
  const context = useContext(TimeEntryContext);
  
  if (!context) {
    throw new Error('useTimeEntryContext must be used within a TimeEntryProvider');
  }
  
  return context;
};
