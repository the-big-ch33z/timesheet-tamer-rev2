
import { useCallback } from 'react';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursCleaner');

interface UseWorkHoursCleanerProps {
  workHoursMap: Map<string, any>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
}

export const useWorkHoursCleaner = ({
  workHoursMap,
  setWorkHoursMap
}: UseWorkHoursCleanerProps) => {
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

  return {
    resetDayWorkHours
  };
};
