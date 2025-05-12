
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
  const { getWorkHours, hasCustomWorkHours, getWorkHoursForDate } = useWorkHoursCore({
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    getDefaultHoursFromSchedule
  });

  const { saveWorkHours, clearWorkHours, saveWorkHoursForDate } = useWorkHoursModification({
    workHoursMap,
    setWorkHoursMap,
    getDefaultHoursFromSchedule
  });

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
