
import { WorkSchedule, WeekDay } from "@/types";

// Define a validation result type for clean type checking
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// Helper function to get weekday from date
export const getWeekDay = (date: Date): WeekDay => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()] as WeekDay;
};

// Helper function to determine fortnight week (1 or 2)
export const getFortnightWeek = (date: Date): 1 | 2 => {
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weeksSinceYearStart = Math.floor(
    (date.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return ((weeksSinceYearStart % 2) + 1) as 1 | 2;
};

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
