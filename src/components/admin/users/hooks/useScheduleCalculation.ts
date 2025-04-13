
import { useState, useEffect } from "react";
import { WorkSchedule } from "@/types";
import { calculateFortnightHoursFromSchedule } from "@/utils/time/scheduleUtils";

interface UseScheduleCalculationProps {
  useDefaultSchedule: boolean;
  selectedScheduleId: string | undefined;
  fte: number;
  schedules: WorkSchedule[];
  defaultSchedule: WorkSchedule;
}

interface ScheduleCalculationResult {
  baseScheduleHours: number | null;
  adjustedHours: number | null;
}

export const useScheduleCalculation = ({
  useDefaultSchedule,
  selectedScheduleId,
  fte,
  schedules,
  defaultSchedule
}: UseScheduleCalculationProps): ScheduleCalculationResult => {
  const [baseScheduleHours, setBaseScheduleHours] = useState<number | null>(null);
  const [adjustedHours, setAdjustedHours] = useState<number | null>(null);
  
  // Update hours calculations when schedule selection or FTE changes
  useEffect(() => {
    let baseHours = 0;
    
    if (useDefaultSchedule) {
      // Calculate hours from default schedule
      baseHours = calculateFortnightHoursFromSchedule(defaultSchedule);
    } else if (selectedScheduleId) {
      const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
      if (selectedSchedule) {
        baseHours = calculateFortnightHoursFromSchedule(selectedSchedule);
      }
    }
    
    if (baseHours > 0) {
      setBaseScheduleHours(baseHours);
      
      // Apply FTE to calculate adjusted hours
      const calculatedAdjustedHours = baseHours * fte;
      // Round to nearest 0.5
      const roundedHours = Math.round(calculatedAdjustedHours * 2) / 2;
      setAdjustedHours(roundedHours);
    } else {
      setBaseScheduleHours(null);
      setAdjustedHours(null);
    }
  }, [selectedScheduleId, useDefaultSchedule, schedules, defaultSchedule, fte]);

  return { baseScheduleHours, adjustedHours };
};
