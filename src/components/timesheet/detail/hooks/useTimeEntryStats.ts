
/**
 * @deprecated Import from @/hooks/timesheet/useTimeEntryStats instead
 * This file is kept for backward compatibility
 */

import { deprecationWarning } from "@/utils/deprecation/deprecationWarnings";
import { 
  useTimeEntryStats as UseTimeEntryStatsFromHooks,
} from "@/hooks/timesheet/useTimeEntryStats";

// Properly re-export the type with 'export type' syntax
export type { TimeEntryStats } from "@/hooks/timesheet/useTimeEntryStats";

export const useTimeEntryStats = (...args: Parameters<typeof UseTimeEntryStatsFromHooks>) => {
  deprecationWarning(
    "useTimeEntryStats",
    "Import this hook from @/hooks/timesheet/useTimeEntryStats instead"
  );
  
  return UseTimeEntryStatsFromHooks(...args);
};
