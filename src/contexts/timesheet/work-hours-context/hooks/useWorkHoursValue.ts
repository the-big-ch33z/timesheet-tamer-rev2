
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
