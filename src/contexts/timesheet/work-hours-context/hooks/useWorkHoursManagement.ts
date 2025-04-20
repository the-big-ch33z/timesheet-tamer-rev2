
import { useWorkHoursCleaner } from './useWorkHoursCleaner';
import { useWorkHoursRefresher } from './useWorkHoursRefresher';
import { useWorkHoursSynchronizer } from './useWorkHoursSynchronizer';

interface UseWorkHoursManagementProps {
  workHoursMap: Map<string, any>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
}

export const useWorkHoursManagement = ({
  workHoursMap,
  setWorkHoursMap
}: UseWorkHoursManagementProps) => {
  const { resetDayWorkHours } = useWorkHoursCleaner({
    workHoursMap,
    setWorkHoursMap
  });
  
  const { refreshTimesForDate } = useWorkHoursRefresher({
    workHoursMap,
    setWorkHoursMap
  });
  
  const { synchronizeFromRemote } = useWorkHoursSynchronizer({
    setWorkHoursMap
  });

  return {
    resetDayWorkHours,
    refreshTimesForDate,
    synchronizeFromRemote
  };
};
