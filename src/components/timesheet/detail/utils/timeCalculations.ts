
import { calculateHoursVariance } from "../../utils/calculations";
import { isUndertime } from "../../utils/calculations/hoursVariance";

/**
 * Calculates hours between start and end time
 * @param startTime Start time in HH:MM format
 * @param endTime End time in HH:MM format
 * @returns Number of hours between times
 */
export const calculateHoursFromTimes = (startTime: string, endTime: string): number => {
  try {
    console.log(`Calculating hours from times: ${startTime} to ${endTime}`);
    
    // Parse the time strings into hours and minutes
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Calculate the difference in minutes
    let diffMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    
    // Handle cases where end time is on the next day
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }
    
    // Convert minutes to hours with 1 decimal place
    const hours = Math.round(diffMinutes / 6) / 10;
    console.log(`Calculated hours: ${hours}`);
    return hours;
  } catch (error) {
    console.error("Error calculating hours from times:", error);
    return 0;
  }
};

/**
 * Format hours to display format
 * @param hours Number of hours
 * @returns Formatted string (e.g. "8.0 hrs")
 */
export const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)} hrs`;
};

export { calculateHoursVariance, isUndertime };
