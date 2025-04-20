
import { useCallback } from 'react';
import { format } from 'date-fns';
import { useWorkHoursLogger } from './useWorkHoursLogger';

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
  const { logWorkHoursRetrieval, logDefaultHours, logCustomHoursCheck } = useWorkHoursLogger();

  const getWorkHours = useCallback((date: Date, userId: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    
    const savedHours = latestWorkHoursRef.current.get(key);
    logWorkHoursRetrieval(dateString, userId, savedHours);
    
    if (savedHours) {
      return {
        startTime: savedHours.startTime || "",
        endTime: savedHours.endTime || "",
        isCustom: savedHours.isCustom
      };
    }
    
    const defaultHours = getDefaultHoursFromSchedule(date, userId);
    logDefaultHours(dateString, defaultHours.startTime, defaultHours.endTime);
    
    return {
      startTime: defaultHours.startTime,
      endTime: defaultHours.endTime,
      isCustom: false
    };
  }, [getDefaultHoursFromSchedule, logWorkHoursRetrieval, logDefaultHours]);

  const hasCustomWorkHours = useCallback((date: Date, userId: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    const hasHours = latestWorkHoursRef.current.has(key) && 
                    latestWorkHoursRef.current.get(key)?.isCustom === true;
    
    logCustomHoursCheck(dateString, userId, hasHours);
    return hasHours;
  }, [logCustomHoursCheck]);

  return {
    getWorkHours,
    hasCustomWorkHours
  };
};
