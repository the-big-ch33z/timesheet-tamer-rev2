
/**
 * @deprecated Import from @/hooks/timesheet/useTimeEntryStats instead
 * This file is kept for backward compatibility
 */

import { deprecationWarning } from "@/utils/deprecation/deprecationWarnings";
import { 
  useTimeEntryStats as UseTimeEntryStatsFromHooks,
  TimeEntryStats
} from "@/hooks/timesheet/useTimeEntryStats";

export { TimeEntryStats };

export const useTimeEntryStats = (...args: Parameters<typeof UseTimeEntryStatsFromHooks>) => {
  deprecationWarning(
    "useTimeEntryStats",
    "Import this hook from @/hooks/timesheet/useTimeEntryStats instead"
  );
  
  return UseTimeEntryStatsFromHooks(...args);
};
