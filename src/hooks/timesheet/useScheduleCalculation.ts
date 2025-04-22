
import { useState, useEffect } from "react";
import { WorkSchedule } from "@/types";
import { calculateFortnightHoursFromSchedule } from "@/utils/time/scheduleUtils";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('useScheduleCalculation');

export const useScheduleCalculation = (schedule?: WorkSchedule, fte: number = 1.0) => {
  const [fortnightHours, setFortnightHours] = useState<number>(0);
  
  useEffect(() => {
    if (!schedule) {
      logger.debug('No schedule provided, setting 0 hours');
      setFortnightHours(0);
      return;
    }
    
    // Calculate base hours from schedule taking into account RDOs
    const baseHours = calculateFortnightHoursFromSchedule(schedule);
    logger.debug(`Calculated base fortnight hours: ${baseHours} for schedule ${schedule.id}`);
    
    // Apply FTE adjustment and round to nearest 0.5
    const adjustedHours = Math.round((baseHours * fte) * 2) / 2;
    logger.debug(`Adjusted hours with FTE ${fte}: ${adjustedHours}`);
    
    setFortnightHours(adjustedHours);
    
  }, [
    schedule?.id, 
    fte,
    // Deep dependencies to ensure reactivity to any schedule changes
    JSON.stringify(schedule?.weeks),
    JSON.stringify(schedule?.rdoDays)
  ]);

  return {
    fortnightHours
  };
};
