
/**
 * Hours calculation utilities
 * Functions for calculating hours between times and related operations
 */
import { calculateFortnightHoursFromSchedule } from '../scheduleUtils';
import { WorkSchedule } from '@/types';

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
 * Calculate monthly target hours based on fortnight hours
 * @param fortnightHours Hours for a fortnight
 * @param workDaysInMonth Number of work days in the month
 * @returns Target hours for the month
 */
export const calculateMonthlyTargetHours = (fortnightHours: number, workDaysInMonth: number): number => {
  const fortnightWorkDays = 10; // Standard number of work days in a fortnight
  // Calculate target hours proportionally
  const targetHours = (workDaysInMonth / fortnightWorkDays) * fortnightHours;
  // Round to 1 decimal place
  return Math.round(targetHours * 10) / 10;
};

/**
 * Calculate adjusted fortnight hours based on work schedule and FTE
 * @param workSchedule The work schedule
 * @param userFte User's full-time equivalent value (0-1)
 * @returns Adjusted fortnight hours
 */
export const calculateAdjustedFortnightHours = (
  workSchedule?: WorkSchedule, 
  userFte: number = 1.0
): number => {
  if (!workSchedule) return 0;
  
  // Calculate fortnight hours based on the schedule
  const scheduleHours = calculateFortnightHoursFromSchedule(workSchedule);
  
  // Apply FTE to the schedule hours if user has an FTE set
  if (userFte !== 1.0 && userFte > 0) {
    return scheduleHours * userFte;
  }
  
  return scheduleHours;
};
