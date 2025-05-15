
import { useCallback } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursModification');

interface UseWorkHoursModificationProps {
  workHoursMap: Map<string, any>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
  getDefaultHoursFromSchedule: (date: Date, userId: string) => { startTime: string; endTime: string };
}

export const useWorkHoursModification = ({
  workHoursMap,
  setWorkHoursMap,
  getDefaultHoursFromSchedule
}: UseWorkHoursModificationProps) => {
  const saveWorkHours = useCallback((date: Date, userId: string, startTime: string, endTime: string): void => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    logger.debug(`Saving work hours for ${dateString}:`, { startTime, endTime, userId });
    
    // Save to localStorage immediately
    const saveToLocalStorage = (workHoursMap: Map<string, any>) => {
      try {
        const storageData = Array.from(workHoursMap.entries()).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>);
        
        localStorage.setItem('work-hours-data', JSON.stringify(storageData));
        logger.debug('Saved work hours to localStorage');
      } catch (error) {
        logger.error('Error saving to localStorage:', error);
      }
    };
    
    // If both times are empty, remove the entry
    if (!startTime && !endTime) {
      logger.debug(`Both times are empty, removing entry if exists`);
      
      setWorkHoursMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        
        // Save to localStorage after state update
        setTimeout(() => saveToLocalStorage(newMap), 0);
        
        return newMap;
      });
      return;
    }
    
    // Check if the times match the default schedule
    const defaultHours = getDefaultHoursFromSchedule(date, userId);
    const isDefault = startTime === defaultHours.startTime && endTime === defaultHours.endTime;
    
    if (isDefault) {
      logger.debug(`Hours match schedule default, removing custom entry`);
      setWorkHoursMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        
        // Save to localStorage after state update
        setTimeout(() => saveToLocalStorage(newMap), 0);
        
        return newMap;
      });
      return;
    }
    
    // Save the custom hours
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
      
      // Save to localStorage after state update
      setTimeout(() => saveToLocalStorage(newMap), 0);
      
      return newMap;
    });
    
    logger.debug(`Successfully saved work hours for ${dateString}`);
  }, [getDefaultHoursFromSchedule]);

  const clearWorkHours = useCallback((userId: string): void => {
    logger.debug(`Clearing all hours for user ${userId}`);
    
    setWorkHoursMap(prev => {
      const newMap = new Map(prev);
      
      Array.from(newMap.entries())
        .filter(([key]) => key.startsWith(`${userId}-`))
        .forEach(([key]) => newMap.delete(key));
      
      // Save to localStorage after clearing
      try {
        const storageData = Array.from(newMap.entries()).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>);
        
        localStorage.setItem('work-hours-data', JSON.stringify(storageData));
        logger.debug('Saved cleared work hours to localStorage');
      } catch (error) {
        logger.error('Error saving cleared hours to localStorage:', error);
      }
        
      return newMap;
    });
  }, []);

  return {
    saveWorkHours,
    clearWorkHours
  };
};
