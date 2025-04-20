
import { useCallback } from 'react';
import { format } from 'date-fns';
import { WorkHoursContextType } from '../types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursValue');

interface UseWorkHoursValueProps {
  workHoursMap: Map<string, any>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
  latestWorkHoursRef: React.MutableRefObject<Map<string, any>>;
  getDefaultHoursFromSchedule: (date: Date, userId: string) => { startTime: string; endTime: string };
}

export const useWorkHoursValue = ({
  workHoursMap,
  setWorkHoursMap,
  latestWorkHoursRef,
  getDefaultHoursFromSchedule
}: UseWorkHoursValueProps): WorkHoursContextType => {
  const hasCustomWorkHours = useCallback((date: Date, userId: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    const hasHours = latestWorkHoursRef.current.has(key) && 
                    latestWorkHoursRef.current.get(key)?.isCustom === true;
    
    logger.debug(`Checking for custom hours for ${dateString}, userId: ${userId}, result: ${hasHours}`);
    return hasHours;
  }, []);

  const getWorkHours = useCallback((date: Date, userId: string) => {
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
    
    const defaultHours = getDefaultHoursFromSchedule(date, userId);
    const isDefault = startTime === defaultHours.startTime && endTime === defaultHours.endTime;
    
    if (isDefault) {
      logger.debug(`Hours match schedule default, removing custom entry`);
      if (latestWorkHoursRef.current.has(key)) {
        setWorkHoursMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      }
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

  const synchronizeFromRemote = useCallback((remoteData: any[]): void => {
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

  return {
    getWorkHours,
    saveWorkHours,
    clearWorkHours,
    hasCustomWorkHours,
    resetDayWorkHours,
    refreshTimesForDate,
    synchronizeFromRemote
  };
};
