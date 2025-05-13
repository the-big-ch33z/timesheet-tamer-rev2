
import React, { createContext, useContext } from 'react';
import { TimeEntry } from '@/types';

/**
 * @deprecated Use TimeEntryContext instead
 * This is a compatibility layer for legacy code using the old EntriesContext
 * It wraps the unified TimeEntryContext and provides the same interface
 */
export interface EntriesContextValue {
  entries: TimeEntry[];
  isLoading: boolean;
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => Promise<boolean>;
  getDayEntries: (date: Date) => TimeEntry[];
  getMonthEntries: (date: Date, userId?: string) => TimeEntry[];
}

export const EntriesContext = createContext<EntriesContextValue | undefined>(undefined);

// Import in try/catch to avoid circular dependencies
let useTimeEntryContext: any;
try {
  const { useTimeEntryContext: importedHook } = require('./TimeEntryContext');
  useTimeEntryContext = importedHook;
} catch (error) {
  console.error("Error importing TimeEntryContext:", error);
  // Fallback will be handled in the provider
}

/**
 * @deprecated Use TimeEntryProvider instead
 * Provider that wraps TimeEntryContext and exposes it through the old interface
 */
export const EntriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("Initializing EntriesProvider compatibility layer");
  
  // Create a fallback value that logs when methods are called
  const createFallbackValue = (): EntriesContextValue => {
    const logError = (methodName: string) => {
      console.error(`EntriesContext: ${methodName} called but context is not available`);
    };
    
    return {
      entries: [],
      isLoading: false,
      createEntry: (entry) => {
        logError("createEntry");
        return null;
      },
      updateEntry: (id, updates) => {
        logError("updateEntry");
      },
      deleteEntry: async (id) => {
        logError("deleteEntry");
        return false;
      },
      getDayEntries: (date) => {
        logError("getDayEntries");
        return [];
      },
      getMonthEntries: (date, userId) => {
        logError("getMonthEntries");
        return [];
      }
    };
  };
  
  try {
    // Safely try to use the imported context hook
    if (!useTimeEntryContext) {
      throw new Error("TimeEntryContext not imported correctly");
    }
    
    // Use the unified context
    const timeEntryContext = useTimeEntryContext();
    
    // Map to the old interface
    const value: EntriesContextValue = {
      entries: timeEntryContext.entries || [],
      isLoading: timeEntryContext.isLoading || false,
      createEntry: timeEntryContext.createEntry || (() => null),
      updateEntry: timeEntryContext.updateEntry || (() => {}),
      deleteEntry: timeEntryContext.deleteEntry || (async () => false),
      getDayEntries: (date: Date) => {
        return timeEntryContext.getDayEntries ? timeEntryContext.getDayEntries(date) : [];
      },
      getMonthEntries: (date: Date, userId?: string) => {
        return timeEntryContext.getMonthEntries ? 
          timeEntryContext.getMonthEntries(date, userId || '') : [];
      },
    };
    
    return (
      <EntriesContext.Provider value={value}>
        {children}
      </EntriesContext.Provider>
    );
  } catch (error) {
    console.error("Error initializing EntriesProvider compatibility layer:", error);
    
    // Provide fallback values
    return (
      <EntriesContext.Provider value={createFallbackValue()}>
        {children}
      </EntriesContext.Provider>
    );
  }
};

/**
 * @deprecated Use useTimeEntryContext instead
 * Hook for accessing the EntriesContext
 */
export const useEntriesContext = (): EntriesContextValue => {
  const ctx = useContext(EntriesContext);
  
  // Create a fallback for when context is not available
  const createFallbackContext = (): EntriesContextValue => {
    console.warn("EntriesContext not found, using fallback");
    
    return {
      entries: [],
      isLoading: false,
      createEntry: () => {
        console.error("Entries context not available");
        return null;
      },
      updateEntry: () => {
        console.error("Entries context not available");
      },
      deleteEntry: async () => {
        console.error("Entries context not available");
        return false;
      },
      getDayEntries: () => [],
      getMonthEntries: () => [],
    };
  };
  
  // If no context is available, try to delegate to the unified context directly
  if (!ctx) {
    try {
      // Import here to avoid circular dependencies
      if (useTimeEntryContext) {
        // Create adapter wrapper when using the unified context directly
        const timeEntryContext = useTimeEntryContext();
        
        return {
          entries: timeEntryContext.entries || [],
          isLoading: timeEntryContext.isLoading || false,
          createEntry: timeEntryContext.createEntry || (() => null),
          updateEntry: timeEntryContext.updateEntry || (() => {}),
          deleteEntry: timeEntryContext.deleteEntry || (async () => false),
          getDayEntries: (date: Date) => {
            return timeEntryContext.getDayEntries ? timeEntryContext.getDayEntries(date) : [];
          },
          getMonthEntries: (date: Date, userId?: string) => {
            return timeEntryContext.getMonthEntries ? 
              timeEntryContext.getMonthEntries(date, userId || '') : [];
          },
        };
      }
    } catch (error) {
      console.error("Failed to use TimeEntryContext directly:", error);
    }
    
    // Last resort fallback
    return createFallbackContext();
  }
  
  return ctx;
};
