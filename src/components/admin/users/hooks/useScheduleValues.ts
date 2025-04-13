
import { useEffect } from "react";
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { UserEditFormValues } from "./useEditUserForm";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { calculateFortnightHoursFromSchedule } from "@/utils/time/scheduleUtils";

interface UseScheduleValuesProps {
  watch: UseFormWatch<UserEditFormValues>;
  setValue: UseFormSetValue<UserEditFormValues>;
}

/**
 * Hook for managing schedule-related values in the user edit form
 * Handles calculations for fortnight hours based on schedule selection and FTE
 */
export const useScheduleValues = ({ watch, setValue }: UseScheduleValuesProps) => {
  // Access work schedule context
  const { getScheduleById, defaultSchedule } = useWorkSchedule();
  
  // Watch for changes to schedule-related fields
  const useDefaultSchedule = watch("useDefaultSchedule");
  const scheduleId = watch("scheduleId");
  const fte = watch("fte");
  
  // Update fortnight hours when schedule selection or FTE changes
  useEffect(() => {
    let baseHours = 0;
    
    if (useDefaultSchedule) {
      // When using default schedule, calculate hours from the default schedule
      baseHours = calculateFortnightHoursFromSchedule(defaultSchedule);
    } else if (scheduleId) {
      // When using custom schedule
      const selectedSchedule = getScheduleById(scheduleId);
      if (selectedSchedule) {
        baseHours = calculateFortnightHoursFromSchedule(selectedSchedule);
      }
    }
    
    if (baseHours > 0) {
      // Apply FTE to calculate the proportional hours
      const adjustedHours = baseHours * fte;
      // Round to nearest 0.5
      const roundedHours = Math.round(adjustedHours * 2) / 2;
      
      console.log(`Updating fortnight hours: base=${baseHours}, FTE=${fte}, adjusted=${adjustedHours}, rounded=${roundedHours}`);
      setValue("fortnightHours", roundedHours);
    }
  }, [useDefaultSchedule, scheduleId, fte, getScheduleById, setValue, defaultSchedule]);

  // Calculate final hours for form submission
  const calculateFinalHours = (): number => {
    let baseHours = 0;
    
    if (useDefaultSchedule) {
      baseHours = calculateFortnightHoursFromSchedule(defaultSchedule);
    } else if (scheduleId) {
      const selectedSchedule = getScheduleById(scheduleId);
      if (selectedSchedule) {
        baseHours = calculateFortnightHoursFromSchedule(selectedSchedule);
      }
    }
    
    if (baseHours > 0) {
      // Apply FTE to calculate the proportional hours
      const adjustedHours = baseHours * fte;
      // Round to nearest 0.5
      return Math.round(adjustedHours * 2) / 2;
    }
    
    return watch("fortnightHours");
  };

  return {
    calculateFinalHours
  };
};
