
import { WorkHoursContextType } from '../types';
import { useWorkHoursCore } from './useWorkHoursCore';
import { useWorkHoursModification } from './useWorkHoursModification';
import { useWorkHoursManagement } from './useWorkHoursManagement';

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
  const { getWorkHours, hasCustomWorkHours } = useWorkHoursCore({
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    getDefaultHoursFromSchedule
  });

  const { saveWorkHours, clearWorkHours } = useWorkHoursModification({
    workHoursMap,
    setWorkHoursMap,
    getDefaultHoursFromSchedule
  });

  const { resetDayWorkHours, refreshTimesForDate, synchronizeFromRemote } = useWorkHoursManagement({
    workHoursMap,
    setWorkHoursMap
  });

  // Add the getDefaultScheduleHours method to match the interface
  const getDefaultScheduleHours = getDefaultHoursFromSchedule;
  
  // Create a workaround for the getWorkHoursForDate method for compatibility
  const getWorkHoursForDate = (date: Date, userId: string) => {
    const result = getWorkHours(date, userId);
    return {
      ...result,
      hasData: !!(result.startTime && result.endTime),
      calculatedHours: 0 // This will be calculated elsewhere
    };
  };
  
  const saveWorkHoursForDate = (date: Date, startTime: string, endTime: string, userId: string) => {
    saveWorkHours(date, userId, startTime, endTime);
  };
  
  // Return with refreshWorkHours added as a placeholder to satisfy the interface
  // The actual implementation will be added in WorkHoursContext.tsx
  return {
    getWorkHours,
    saveWorkHours,
    clearWorkHours,
    hasCustomWorkHours,
    resetDayWorkHours,
    refreshTimesForDate,
    synchronizeFromRemote,
    getDefaultScheduleHours,
    getWorkHoursForDate,
    saveWorkHoursForDate,
    refreshWorkHours: () => {} // This will be overridden in WorkHoursContext.tsx
  };
};
