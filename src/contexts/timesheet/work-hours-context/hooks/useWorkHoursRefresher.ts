
import { useCallback } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursRefresher');

interface UseWorkHoursRefresherProps {
  workHoursMap: Map<string, any>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
}

export const useWorkHoursRefresher = ({
  workHoursMap,
  setWorkHoursMap
}: UseWorkHoursRefresherProps) => {
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

  return {
    refreshTimesForDate
  };
};
