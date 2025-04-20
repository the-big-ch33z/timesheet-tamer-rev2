
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
    
    if (!startTime && !endTime) {
      logger.debug(`Both times are empty, removing entry if exists`);
      
      setWorkHoursMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
      return;
    }
    
    const defaultHours = getDefaultHoursFromSchedule(date, userId);
    const isDefault = startTime === defaultHours.startTime && endTime === defaultHours.endTime;
    
    if (isDefault) {
      logger.debug(`Hours match schedule default, removing custom entry`);
      setWorkHoursMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
      return;
    }
    
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

  return {
    saveWorkHours,
    clearWorkHours
  };
};
