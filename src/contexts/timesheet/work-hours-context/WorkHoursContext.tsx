
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { format } from 'date-fns';

// Define the data structure for storing work hours
interface WorkHoursData {
  startTime: string;
  endTime: string;
  date: string; // ISO date string
  userId: string;
}

interface WorkHoursContextType {
  getWorkHours: (date: Date, userId: string) => { startTime: string; endTime: string };
  saveWorkHours: (date: Date, userId: string, startTime: string, endTime: string) => void;
  clearWorkHours: (userId: string) => void;
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
  
  // Get work hours for a specific date and user
  const getWorkHours = (date: Date, userId: string): { startTime: string; endTime: string } => {
    // Format date to YYYY-MM-DD for consistent lookup
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    const savedHours = workHoursMap.get(key);
    
    if (savedHours) {
      console.debug(`[WorkHoursContext] Found saved hours for ${dateString}:`, savedHours);
      return {
        startTime: savedHours.startTime,
        endTime: savedHours.endTime
      };
    }
    
    // Return default values if not found
    console.debug(`[WorkHoursContext] No saved hours for ${dateString}, using defaults`);
    return {
      startTime: '09:00',
      endTime: '17:00'
    };
  };
  
  // Save work hours for a specific date and user
  const saveWorkHours = (date: Date, userId: string, startTime: string, endTime: string): void => {
    // Format date to YYYY-MM-DD for consistent storage
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    console.debug(`[WorkHoursContext] Saving hours for ${dateString}:`, { startTime, endTime });
    
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      newMap.set(key, {
        date: dateString,
        userId,
        startTime,
        endTime
      });
      return newMap;
    });
  };
  
  // Clear all work hours for a user
  const clearWorkHours = (userId: string): void => {
    console.debug(`[WorkHoursContext] Clearing all hours for user ${userId}`);
    
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      
      // Find all entries for this user and remove them
      Array.from(newMap.entries())
        .filter(([key]) => key.startsWith(`${userId}-`))
        .forEach(([key]) => newMap.delete(key));
        
      return newMap;
    });
  };
  
  const value: WorkHoursContextType = {
    getWorkHours,
    saveWorkHours,
    clearWorkHours
  };
  
  return (
    <WorkHoursContext.Provider value={value}>
      {children}
    </WorkHoursContext.Provider>
  );
};
