
import { useCallback } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursCore');

interface UseWorkHoursCoreProps {
  workHoursMap: Map<string, any>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
  latestWorkHoursRef: React.MutableRefObject<Map<string, any>>;
  getDefaultHoursFromSchedule: (date: Date, userId: string) => { startTime: string; endTime: string };
}

export const useWorkHoursCore = ({
  workHoursMap,
  setWorkHoursMap,
  latestWorkHoursRef,
  getDefaultHoursFromSchedule
}: UseWorkHoursCoreProps) => {
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

  const hasCustomWorkHours = useCallback((date: Date, userId: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    const hasHours = latestWorkHoursRef.current.has(key) && 
                    latestWorkHoursRef.current.get(key)?.isCustom === true;
    
    logger.debug(`Checking for custom hours for ${dateString}, userId: ${userId}, result: ${hasHours}`);
    return hasHours;
  }, []);

  return {
    getWorkHours,
    hasCustomWorkHours
  };
};
