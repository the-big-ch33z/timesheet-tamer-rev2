
import { useCallback } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursManagement');

interface UseWorkHoursManagementProps {
  workHoursMap: Map<string, any>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
}

export const useWorkHoursManagement = ({
  workHoursMap,
  setWorkHoursMap
}: UseWorkHoursManagementProps) => {
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

  const refreshTimesForDate = useCallback((date: Date, userId: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    if (workHoursMap.has(key)) {
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
  }, [workHoursMap]);

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
    resetDayWorkHours,
    refreshTimesForDate,
    synchronizeFromRemote
  };
};
