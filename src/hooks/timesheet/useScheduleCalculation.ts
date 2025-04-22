
import { useMemo, useEffect } from "react";
import { WorkSchedule } from "@/types";
import { calculateFortnightHoursFromSchedule } from "@/utils/time/scheduleUtils";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('useScheduleCalculation');

export const useScheduleCalculation = (workSchedule?: WorkSchedule, fte: number = 1.0) => {
  const fortnightHours = useMemo(() => {
    if (!workSchedule) {
      logger.debug('No work schedule provided, returning 0 hours');
      return 0;
    }
    
    const baseHours = calculateFortnightHoursFromSchedule(workSchedule);
    logger.debug(`Calculated base fortnight hours: ${baseHours} for schedule ${workSchedule.id}`);
    
    // Apply FTE adjustment and round to nearest 0.5
    const adjustedHours = Math.round((baseHours * fte) * 2) / 2;
    logger.debug(`Adjusted hours with FTE ${fte}: ${adjustedHours}`);
    
    return adjustedHours;
  }, [workSchedule, fte]);

  return {
    fortnightHours
  };
};
