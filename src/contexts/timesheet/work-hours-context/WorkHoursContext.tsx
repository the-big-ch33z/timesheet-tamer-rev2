
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

// Create a dedicated logger for this context
const logger = createTimeLogger('WorkHoursContext');

// Define the data structure for storing work hours
interface WorkHoursData {
  startTime: string;
  endTime: string;
  date: string; // ISO date string
  userId: string;
  isCustom: boolean; // Flag to indicate this is a custom override
  lastModified: number; // Timestamp for sync conflict resolution
}

interface WorkHoursContextType {
  getWorkHours: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom: boolean };
  saveWorkHours: (date: Date, userId: string, startTime: string, endTime: string) => void;
  clearWorkHours: (userId: string) => void;
  hasCustomWorkHours: (date: Date, userId: string) => boolean;
  resetDayWorkHours: (date: Date, userId: string) => void;
  synchronizeFromRemote?: (remoteData: WorkHoursData[]) => void; // For future remote sync
}

// Create the context
const WorkHoursContext = createContext<WorkHoursContextType | undefined>(undefined);

// Storage key for localStorage
const STORAGE_KEY = 'timesheet-work-hours';

// Cache expiration time (24 hours in ms)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Custom hook to use the context
export const useWorkHoursContext = (): WorkHoursContextType => {
  const context = useContext(WorkHoursContext);
  if (!context) {
    throw new Error('useWorkHoursContext must be used within a WorkHoursProvider');
  }
  return context;
};

interface WorkHoursProviderProps {
  children: ReactNode;
}

export const WorkHoursProvider: React.FC<WorkHoursProviderProps> = ({ children }) => {
  const [workHoursMap, setWorkHoursMap] = useState<Map<string, WorkHoursData>>(new Map());
  
  // Use a ref to track the latest saved work hours to prevent unnecessary re-renders
  const latestWorkHoursRef = useRef<Map<string, WorkHoursData>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  
  // Cache management functions
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    let hasExpiredEntries = false;
    
    // Create a new map excluding expired entries
    const newMap = new Map<string, WorkHoursData>();
    latestWorkHoursRef.current.forEach((value, key) => {
      if (now - value.lastModified < CACHE_EXPIRATION) {
        newMap.set(key, value);
      } else {
        hasExpiredEntries = true;
        logger.debug(`Removing expired work hours entry: ${key}`);
      }
    });
    
    // Only update if we actually removed something
    if (hasExpiredEntries) {
      latestWorkHoursRef.current = newMap;
      setWorkHoursMap(newMap);
      logger.info('Cache cleanup completed, removed expired entries');
    }
  }, []);
  
  // Load saved work hours from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData: WorkHoursData[] = JSON.parse(savedData);
        
        // Convert array to Map for efficient lookups
        const newMap = new Map<string, WorkHoursData>();
        parsedData.forEach(item => {
          // Create a compound key: userId-date
          const key = `${item.userId}-${item.date}`;
          // Ensure the isCustom flag is set (for backward compatibility)
          item.isCustom = item.isCustom !== undefined ? item.isCustom : true;
          // Ensure lastModified is set
          item.lastModified = item.lastModified || Date.now();
          newMap.set(key, item);
        });
        
        setWorkHoursMap(newMap);
        latestWorkHoursRef.current = newMap;
        logger.debug(`Loaded ${parsedData.length} work hours entries from storage`);
      }
      
      // Mark as initialized
      isInitializedRef.current = true;
      
      // Set up periodic cache cleanup
      const cleanupInterval = setInterval(cleanupCache, 60 * 60 * 1000); // Hourly cleanup
      
      return () => {
        clearInterval(cleanupInterval);
      };
      
    } catch (error) {
      logger.error('Error loading work hours from storage:', error);
      // Still mark as initialized even if there was an error
      isInitializedRef.current = true;
    }
  }, [cleanupCache]);
  
  // Save work hours to localStorage with debounce
  const saveToStorage = useCallback((data: Map<string, WorkHoursData>) => {
    try {
      // Convert Map to Array for storage
      const dataArray = Array.from(data.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataArray));
      logger.debug(`Saved ${dataArray.length} work hours entries to storage`);
    } catch (error) {
      logger.error('Error saving work hours to storage:', error);
    }
  }, []);
  
  // Debounced save to prevent excessive writes
  const debouncedSave = useCallback((data: Map<string, WorkHoursData>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(data);
      saveTimeoutRef.current = null;
    }, 300);
  }, [saveToStorage]);
  
  // Save work hours to localStorage whenever they change
  useEffect(() => {
    if (workHoursMap.size > 0 && isInitializedRef.current) {
      // Update ref for consistent reference
      latestWorkHoursRef.current = workHoursMap;
      debouncedSave(workHoursMap);
    }
    
    return () => {
      // Clear any pending save on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workHoursMap, debouncedSave]);
  
  // Set up cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          logger.debug('Storage change detected, updating local state');
          
          const newData: WorkHoursData[] = JSON.parse(event.newValue);
          
          // Update our state with the new data
          setWorkHoursMap(prevMap => {
            // Start with current map
            const updatedMap = new Map(prevMap);
            
            // Process each new entry
            newData.forEach(item => {
              const key = `${item.userId}-${item.date}`;
              const currentItem = updatedMap.get(key);
              
              // If we don't have this entry or it's newer, use the new one
              if (!currentItem || (item.lastModified > currentItem.lastModified)) {
                updatedMap.set(key, item);
              }
            });
            
            return updatedMap;
          });
        } catch (error) {
          logger.error('Error handling storage change:', error);
        }
      }
    };
    
    // Add listener for storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Set up window unload event handler for final save
  useEffect(() => {
    const handleUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Directly save current data
      try {
        const dataArray = Array.from(latestWorkHoursRef.current.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataArray));
        logger.debug(`Saved ${dataArray.length} work hours entries on page unload`);
      } catch (error) {
        logger.error('Error saving work hours on unload:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);
  
  // Check if there are custom hours saved for a specific date
  const hasCustomWorkHours = useCallback((date: Date, userId: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    const hasHours = latestWorkHoursRef.current.has(key) && 
                    latestWorkHoursRef.current.get(key)?.isCustom === true;
    
    logger.debug(`Checking for custom hours for ${dateString}, userId: ${userId}, result: ${hasHours}`);
    return hasHours;
  }, []);
  
  // Get work hours for a specific date and user
  const getWorkHours = useCallback((date: Date, userId: string): { startTime: string; endTime: string; isCustom: boolean } => {
    // Format date to YYYY-MM-DD for consistent lookup
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    const savedHours = latestWorkHoursRef.current.get(key);
    
    if (savedHours) {
      logger.debug(`Found saved hours for ${dateString}:`, savedHours);
      return {
        startTime: savedHours.startTime || "",
        endTime: savedHours.endTime || "",
        isCustom: savedHours.isCustom
      };
    }
    
    // Return empty values if not found (no defaults)
    logger.debug(`No saved hours for ${dateString}, returning empty values`);
    return {
      startTime: "",
      endTime: "",
      isCustom: false
    };
  }, []);
  
  // Save work hours for a specific date and user
  const saveWorkHours = useCallback((date: Date, userId: string, startTime: string, endTime: string): void => {
    // Format date to YYYY-MM-DD for consistent storage
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    logger.debug(`Saving work hours for ${dateString}:`, { startTime, endTime, userId });
    
    // Only save if we have actual values
    if (!startTime && !endTime) {
      logger.debug(`Both times are empty, removing entry if exists`);
      
      // If both values are empty and we have an existing entry, delete it
      if (latestWorkHoursRef.current.has(key)) {
        setWorkHoursMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      }
      return;
    }
    
    // Create a new map to trigger state update
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      newMap.set(key, {
        date: dateString,
        userId,
        startTime,
        endTime,
        isCustom: true, // Always mark user-saved hours as custom
        lastModified: Date.now() // Add timestamp for sync
      });
      return newMap;
    });
    
    logger.debug(`Successfully saved work hours for ${dateString}`);
  }, []);
  
  // Reset work hours for a specific day to default/schedule
  const resetDayWorkHours = useCallback((date: Date, userId: string): void => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    logger.debug(`Resetting hours for ${dateString} for user ${userId}`);
    
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      if (newMap.has(key)) {
        newMap.delete(key);
      }
      return newMap;
    });
  }, []);
  
  // Clear all work hours for a user
  const clearWorkHours = useCallback((userId: string): void => {
    logger.debug(`Clearing all hours for user ${userId}`);
    
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      
      // Find all entries for this user and remove them
      Array.from(newMap.entries())
        .filter(([key]) => key.startsWith(`${userId}-`))
        .forEach(([key]) => newMap.delete(key));
        
      return newMap;
    });
  }, []);
  
  // Function to synchronize with remote data (for future use)
  const synchronizeFromRemote = useCallback((remoteData: WorkHoursData[]): void => {
    logger.info(`Synchronizing with ${remoteData.length} remote entries`);
    
    setWorkHoursMap(prevMap => {
      const updatedMap = new Map(prevMap);
      
      remoteData.forEach(remoteItem => {
        const key = `${remoteItem.userId}-${remoteItem.date}`;
        const localItem = updatedMap.get(key);
        
        // If we don't have this entry or remote is newer, use remote
        if (!localItem || (remoteItem.lastModified > (localItem.lastModified || 0))) {
          updatedMap.set(key, {
            ...remoteItem,
            lastModified: remoteItem.lastModified || Date.now()
          });
        }
      });
      
      return updatedMap;
    });
  }, []);
  
  const value: WorkHoursContextType = {
    getWorkHours,
    saveWorkHours,
    clearWorkHours,
    hasCustomWorkHours,
    resetDayWorkHours,
    synchronizeFromRemote
  };
  
  return (
    <WorkHoursContext.Provider value={value}>
      {children}
    </WorkHoursContext.Provider>
  );
};
