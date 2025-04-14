
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { DEFAULT_WORK_HOURS } from '@/constants/defaults';

// Define the data structure for storing work hours
interface WorkHoursData {
  startTime: string;
  endTime: string;
  date: string; // ISO date string
  userId: string;
  isCustom: boolean; // Flag to indicate this is a custom override
}

interface WorkHoursContextType {
  getWorkHours: (date: Date, userId: string) => { startTime: string; endTime: string; isCustom: boolean };
  saveWorkHours: (date: Date, userId: string, startTime: string, endTime: string) => void;
  clearWorkHours: (userId: string) => void;
  hasCustomWorkHours: (date: Date, userId: string) => boolean;
  resetDayWorkHours: (date: Date, userId: string) => void;
}

// Create the context
const WorkHoursContext = createContext<WorkHoursContextType | undefined>(undefined);

// Storage key for localStorage
const STORAGE_KEY = 'timesheet-work-hours';

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
          newMap.set(key, item);
        });
        
        setWorkHoursMap(newMap);
        console.debug('[WorkHoursContext] Loaded work hours from storage:', parsedData.length);
      }
    } catch (error) {
      console.error('[WorkHoursContext] Error loading work hours from storage:', error);
    }
  }, []);
  
  // Save work hours to localStorage whenever they change
  useEffect(() => {
    if (workHoursMap.size > 0) {
      try {
        // Convert Map to Array for storage
        const dataArray = Array.from(workHoursMap.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataArray));
        console.debug('[WorkHoursContext] Saved work hours to storage:', dataArray.length);
      } catch (error) {
        console.error('[WorkHoursContext] Error saving work hours to storage:', error);
      }
    }
  }, [workHoursMap]);
  
  // Check if there are custom hours saved for a specific date
  const hasCustomWorkHours = useCallback((date: Date, userId: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    return workHoursMap.has(key) && workHoursMap.get(key)?.isCustom === true;
  }, [workHoursMap]);
  
  // Get work hours for a specific date and user
  const getWorkHours = useCallback((date: Date, userId: string): { startTime: string; endTime: string; isCustom: boolean } => {
    // Format date to YYYY-MM-DD for consistent lookup
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    const savedHours = workHoursMap.get(key);
    
    if (savedHours) {
      console.debug(`[WorkHoursContext] Found saved hours for ${dateString}:`, savedHours);
      return {
        startTime: savedHours.startTime,
        endTime: savedHours.endTime,
        isCustom: savedHours.isCustom
      };
    }
    
    // Return empty values if not found (no defaults)
    console.debug(`[WorkHoursContext] No saved hours for ${dateString}, returning empty values`);
    return {
      startTime: "",
      endTime: "",
      isCustom: false
    };
  }, [workHoursMap]);
  
  // Save work hours for a specific date and user
  const saveWorkHours = useCallback((date: Date, userId: string, startTime: string, endTime: string): void => {
    // Format date to YYYY-MM-DD for consistent storage
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    console.debug(`[WorkHoursContext] Saving custom hours for ${dateString}:`, { startTime, endTime });
    
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      newMap.set(key, {
        date: dateString,
        userId,
        startTime,
        endTime,
        isCustom: true // Always mark user-saved hours as custom
      });
      return newMap;
    });
  }, []);
  
  // Reset work hours for a specific day to default/schedule
  const resetDayWorkHours = useCallback((date: Date, userId: string): void => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    console.debug(`[WorkHoursContext] Resetting hours for ${dateString} for user ${userId}`);
    
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
    console.debug(`[WorkHoursContext] Clearing all hours for user ${userId}`);
    
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      
      // Find all entries for this user and remove them
      Array.from(newMap.entries())
        .filter(([key]) => key.startsWith(`${userId}-`))
        .forEach(([key]) => newMap.delete(key));
        
      return newMap;
    });
  }, []);
  
  const value: WorkHoursContextType = {
    getWorkHours,
    saveWorkHours,
    clearWorkHours,
    hasCustomWorkHours,
    resetDayWorkHours
  };
  
  return (
    <WorkHoursContext.Provider value={value}>
      {children}
    </WorkHoursContext.Provider>
  );
};
