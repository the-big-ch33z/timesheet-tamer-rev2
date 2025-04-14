
import { calculateFortnightHoursFromSchedule } from "../scheduleUtils";

/**
 * Calculate hours difference between two time strings (HH:MM format)
 */
export const calculateHoursFromTimes = (start: string, end: string): number => {
  if (!start || !end) return 0;

  // Parse hours and minutes from time strings
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  // Convert to decimal hours
  const startDecimal = startHour + (startMinute / 60);
  const endDecimal = endHour + (endMinute / 60);

  // Ensure end time is after start time
  if (startDecimal >= endDecimal) {
    throw new Error('End time must be after start time');
  }

  // Calculate difference and round to nearest 0.25
  const rawHours = endDecimal - startDecimal;
  const roundedHours = Math.round(rawHours * 4) / 4;

  return roundedHours;
};

// Re-export the function from scheduleUtils for convenience
export { calculateFortnightHoursFromSchedule };
