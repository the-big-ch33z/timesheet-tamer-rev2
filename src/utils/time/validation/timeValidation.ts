
/**
 * Time validation utilities
 * Functions for validating time entries against schedules and business rules
 */
import { WorkSchedule, WeekDay } from "@/types";
import { getWeekDay, getFortnightWeek } from "../scheduleUtils";

// Define a validation result type for clean type checking
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// Check if the selected time is within the working hours
export const validateTime = (
  start: string, 
  end: string, 
  selectedDate: Date, 
  workSchedule?: WorkSchedule
): ValidationResult => {
  if (!workSchedule || !selectedDate) return { valid: true };

  const weekDay = getWeekDay(selectedDate);
  const weekNum = getFortnightWeek(selectedDate);
  
  // Check if it's an RDO
  if (workSchedule.rdoDays[weekNum].includes(weekDay)) {
    return {
      valid: false,
      message: "This is a rostered day off (RDO). Time entries are not expected."
    };
  }
  
  // Get scheduled work hours for this day
  const scheduledHours = workSchedule.weeks[weekNum][weekDay];
  
  // If no scheduled hours, it's not a working day
  if (!scheduledHours) {
    return {
      valid: false,
      message: "This is not a scheduled working day."
    };
  }
  
  // Check if time is within working hours
  const schedStart = scheduledHours.startTime;
  const schedEnd = scheduledHours.endTime;
  
  if (start < schedStart || end > schedEnd) {
    return {
      valid: false,
      message: `Time entries should be within scheduled working hours (${schedStart} - ${schedEnd}).`
    };
  }
  
  return { valid: true };
};

/**
 * Validate if a time string is in proper HH:MM format
 * @param timeString Time string to validate
 * @returns True if the time string is valid
 */
export const isValidTimeFormat = (timeString: string): boolean => {
  // Check if the string matches the HH:MM pattern
  const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return timePattern.test(timeString);
};
