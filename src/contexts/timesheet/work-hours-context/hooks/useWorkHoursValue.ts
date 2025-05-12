
import { WorkHoursContextType, WorkHoursData } from '../../types';
import { useWorkHoursCore } from './useWorkHoursCore';
import { useWorkHoursModification } from './useWorkHoursModification';
import { useWorkHoursManagement } from './useWorkHoursManagement';
import { useWorkHoursSynchronizer } from './useWorkHoursSynchronizer';

interface UseWorkHoursValueProps {
  workHoursMap: Map<string, WorkHoursData>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, WorkHoursData>>>;
  latestWorkHoursRef: React.MutableRefObject<Map<string, WorkHoursData>>;
  getDefaultHoursFromSchedule: (date: Date, userId: string) => { startTime: string; endTime: string };
}

export const useWorkHoursValue = ({
  workHoursMap,
  setWorkHoursMap,
  latestWorkHoursRef,
  getDefaultHoursFromSchedule
}: UseWorkHoursValueProps): WorkHoursContextType => {
  const coreHooks = useWorkHoursCore({
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    getDefaultHoursFromSchedule
  });

  const { getWorkHours, hasCustomWorkHours } = coreHooks;
  
  // Create getWorkHoursForDate if it doesn't exist
  const getWorkHoursForDate = (date: Date, userId: string) => {
    const baseHours = getWorkHours(date, userId);
    return {
      ...baseHours,
      hasData: baseHours.isCustom
    };
  };

  const modificationHooks = useWorkHoursModification({
    workHoursMap,
    setWorkHoursMap,
    getDefaultHoursFromSchedule
  });
  
  const { saveWorkHours, clearWorkHours } = modificationHooks;
  
  // Create saveWorkHoursForDate if it doesn't exist
  const saveWorkHoursForDate = (date: Date, startTime: string, endTime: string, userId: string) => {
    saveWorkHours(date, userId, startTime, endTime);
  };

  const { resetDayWorkHours, refreshTimesForDate } = useWorkHoursManagement({
    workHoursMap,
    setWorkHoursMap
  });

  const { synchronizeFromRemote } = useWorkHoursSynchronizer({
    setWorkHoursMap
  });

  return {
    getWorkHours,
    saveWorkHours,
    clearWorkHours,
    hasCustomWorkHours,
    resetDayWorkHours,
    refreshTimesForDate,
    synchronizeFromRemote,
    getDefaultScheduleHours: getDefaultHoursFromSchedule,
    getWorkHoursForDate,
    saveWorkHoursForDate
  };
};
