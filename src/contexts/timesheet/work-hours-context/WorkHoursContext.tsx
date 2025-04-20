import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { getDayScheduleInfo } from '@/utils/time/scheduleUtils';

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
  refreshTimesForDate: (date: Date, userId: string) => void;
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
  const latestWorkHoursRef = useRef<Map<string, WorkHoursData>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  
  // Access WorkScheduleContext to derive defaults when needed
  const { 
    defaultSchedule, 
    schedules, 
    userSchedules, 
    getUserSchedule 
  } = useWorkSchedule();

  const cleanupCache = useCallback(() => {
    const now = Date.now();
    let hasExpiredEntries = false;
    
    const newMap = new Map<string, WorkHoursData>();
    latestWorkHoursRef.current.forEach((value, key) => {
      if (now - value.lastModified < CACHE_EXPIRATION) {
        newMap.set(key, value);
      } else {
        hasExpiredEntries = true;
        logger.debug(`Removing expired work hours entry: ${key}`);
      }
    });
    
    if (hasExpiredEntries) {
      latestWorkHoursRef.current = newMap;
      setWorkHoursMap(newMap);
      logger.info('Cache cleanup completed, removed expired entries');
    }
  }, []);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData: WorkHoursData[] = JSON.parse(savedData);
        
        const newMap = new Map<string, WorkHoursData>();
        parsedData.forEach(item => {
          const key = `${item.userId}-${item.date}`;
          item.isCustom = item.isCustom !== undefined ? item.isCustom : true;
          item.lastModified = item.lastModified || Date.now();
          newMap.set(key, item);
        });
        
        setWorkHoursMap(newMap);
        latestWorkHoursRef.current = newMap;
        logger.debug(`Loaded ${parsedData.length} work hours entries from storage`);
      }
      
      isInitializedRef.current = true;
      
      const cleanupInterval = setInterval(cleanupCache, 60 * 60 * 1000);
      return () => {
        clearInterval(cleanupInterval);
      };
    } catch (error) {
      logger.error('Error loading work hours from storage:', error);
      isInitializedRef.current = true;
    }
  }, [cleanupCache]);

  const saveToStorage = useCallback((data: Map<string, WorkHoursData>) => {
    try {
      const dataArray = Array.from(data.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataArray));
      logger.debug(`Saved ${dataArray.length} work hours entries to storage`);
    } catch (error) {
      logger.error('Error saving work hours to storage:', error);
    }
  }, []);

  const debouncedSave = useCallback((data: Map<string, WorkHoursData>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(data);
      saveTimeoutRef.current = null;
    }, 300);
  }, [saveToStorage]);

  useEffect(() => {
    if (workHoursMap.size > 0 && isInitializedRef.current) {
      latestWorkHoursRef.current = workHoursMap;
      debouncedSave(workHoursMap);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workHoursMap, debouncedSave]);

  // Helper function to get default hours from a user's schedule
  const getDefaultHoursFromSchedule = useCallback((date: Date, userId: string): { startTime: string; endTime: string } => {
    try {
      // Get the user's assigned schedule
      const userSchedule = getUserSchedule(userId);
      
      // Find the actual schedule object
      const schedule = userSchedule === 'default'
        ? defaultSchedule
        : schedules.find(s => s.id === userSchedule) || defaultSchedule;
      
      // Get the day's schedule info using the utility function
      const daySchedule = getDayScheduleInfo(date, schedule);
      
      if (daySchedule && daySchedule.isWorkingDay && daySchedule.hours) {
        logger.debug(`Derived default hours for ${userId} on ${format(date, 'yyyy-MM-dd')} from schedule: ${daySchedule.hours.startTime}-${daySchedule.hours.endTime}`);
        return {
          startTime: daySchedule.hours.startTime,
          endTime: daySchedule.hours.endTime
        };
      }
      
      // Fall back to standard working hours if no schedule found
      logger.debug(`No schedule hours found for ${userId} on ${format(date, 'yyyy-MM-dd')}, using defaults`);
      return { startTime: "09:00", endTime: "17:00" };
    } catch (error) {
      logger.error(`Error getting default hours from schedule: ${error}`);
      return { startTime: "09:00", endTime: "17:00" };
    }
  }, [defaultSchedule, schedules, getUserSchedule]);

  const refreshTimesForDate = useCallback((date: Date, userId: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    if (latestWorkHoursRef.current.has(key)) {
      logger.debug(`Refreshing work hours for ${dateString}, userId: ${userId}`);
      
      setWorkHoursMap(prevMap => {
        const newMap = new Map(prevMap);
        const entry = newMap.get(key);
        
        if (entry) {
          newMap.set(key, {
            ...entry,
            lastModified: Date.now()
          });
        }
        
        return newMap;
      });
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          logger.debug('Storage change detected, updating local state');
          
          const newData: WorkHoursData[] = JSON.parse(event.newValue);
          
          setWorkHoursMap(prevMap => {
            const updatedMap = new Map(prevMap);
            
            newData.forEach(item => {
              const key = `${item.userId}-${item.date}`;
              const currentItem = updatedMap.get(key);
              
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
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
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

  const hasCustomWorkHours = useCallback((date: Date, userId: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    const hasHours = latestWorkHoursRef.current.has(key) && 
                    latestWorkHoursRef.current.get(key)?.isCustom === true;
    
    logger.debug(`Checking for custom hours for ${dateString}, userId: ${userId}, result: ${hasHours}`);
    return hasHours;
  }, []);

  const getWorkHours = useCallback((date: Date, userId: string): { startTime: string; endTime: string; isCustom: boolean } => {
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
    
    // If no saved hours are found, derive defaults from the work schedule
    const defaultHours = getDefaultHoursFromSchedule(date, userId);
    logger.debug(`No saved hours for ${dateString}, returning derived schedule hours: ${defaultHours.startTime}-${defaultHours.endTime}`);
    
    return {
      startTime: defaultHours.startTime,
      endTime: defaultHours.endTime,
      isCustom: false
    };
  }, [getDefaultHoursFromSchedule]);

  const saveWorkHours = useCallback((date: Date, userId: string, startTime: string, endTime: string): void => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    logger.debug(`Saving work hours for ${dateString}:`, { startTime, endTime, userId });
    
    if (!startTime && !endTime) {
      logger.debug(`Both times are empty, removing entry if exists`);
      
      if (latestWorkHoursRef.current.has(key)) {
        setWorkHoursMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      }
      return;
    }
    
    // Check if these hours match the schedule default
    const defaultHours = getDefaultHoursFromSchedule(date, userId);
    const isDefault = startTime === defaultHours.startTime && endTime === defaultHours.endTime;
    
    if (isDefault) {
      logger.debug(`Hours match schedule default, removing custom entry`);
      // If times match default, remove the custom entry (if any) to save space
      if (latestWorkHoursRef.current.has(key)) {
        setWorkHoursMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      }
      return;
    }
    
    // Otherwise save as a custom entry
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      newMap.set(key, {
        date: dateString,
        userId,
        startTime,
        endTime,
        isCustom: true,
        lastModified: Date.now()
      });
      return newMap;
    });
    
    logger.debug(`Successfully saved work hours for ${dateString}`);
  }, [getDefaultHoursFromSchedule]);

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

  const clearWorkHours = useCallback((userId: string): void => {
    logger.debug(`Clearing all hours for user ${userId}`);
    
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      
      Array.from(newMap.entries())
        .filter(([key]) => key.startsWith(`${userId}-`))
        .forEach(([key]) => newMap.delete(key));
        
      return newMap;
    });
  }, []);

  const synchronizeFromRemote = useCallback((remoteData: WorkHoursData[]): void => {
    logger.info(`Synchronizing with ${remoteData.length} remote entries`);
    
    setWorkHoursMap(prevMap => {
      const updatedMap = new Map(prevMap);
      
      remoteData.forEach(remoteItem => {
        const key = `${remoteItem.userId}-${remoteItem.date}`;
        const localItem = updatedMap.get(key);
        
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
    refreshTimesForDate,
    synchronizeFromRemote
  };

  return (
    <WorkHoursContext.Provider value={value}>
      {children}
    </WorkHoursContext.Provider>
  );
};
