
import { TimeCalculationError } from "../errors/timeErrorHandling";
import { calculateFortnightHoursFromSchedule } from "../scheduleUtils";
import { getWorkdaysInMonth, getFortnightWeek } from "../scheduleUtils";
import { WorkSchedule, WeekDay } from "@/types";
import { eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";

/**
 * Normalize a time string to HH:mm format
 */
const normalizeTime = (time: string): string => {
  // Handle single-digit hour case (e.g. "1" -> "01:00")
  if (/^\d$/.test(time)) {
    return `0${time}:00`;
  }
  
  // Handle hour-only case (e.g. "10" -> "10:00")
  if (/^\d{2}$/.test(time)) {
    return `${time}:00`;
  }
  
  // Handle non-zero-padded hour with minutes (e.g. "9:30" -> "09:30")
  if (/^(\d):(\d{2})$/.test(time)) {
    const [hour, minute] = time.split(':');
    return `0${hour}:${minute}`;
  }
  
  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }
  
  // Default case - return original if we can't normalize it
  // The validation will catch this later
  return time;
};

/**
 * Validate that a time string is in correct HH:MM format
 */
const validateTimeFormat = (time: string): boolean => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

/**
 * Calculate hours difference between two time strings (HH:MM format)
 */
export const calculateHoursFromTimes = (start: string, end: string): number => {
  if (!start || !end) return 0;

  try {
    // Normalize times first
    const normalizedStart = normalizeTime(start);
    const normalizedEnd = normalizeTime(end);
    
    // Validate formats after normalization
    if (!validateTimeFormat(normalizedStart) || !validateTimeFormat(normalizedEnd)) {
      throw new TimeCalculationError(`Invalid time format: start="${start}" (normalized to "${normalizedStart}"), end="${end}" (normalized to "${normalizedEnd}")`);
    }

    const [startHour, startMinute] = normalizedStart.split(':').map(Number);
    const [endHour, endMinute] = normalizedEnd.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    // Make sure end is after start
    if (endTotalMinutes < startTotalMinutes) {
      throw new TimeCalculationError(`End time must be after start time: ${start} to ${end}`);
    }
    
    const diffMinutes = endTotalMinutes - startTotalMinutes;

    return diffMinutes / 60;
  } catch (error) {
    if (error instanceof TimeCalculationError) {
      throw error;
    }
    throw new TimeCalculationError(`Failed to calculate hours from ${start} to ${end}: ${error}`);
  }
};

/**
 * Calculate monthly target hours based on schedule
 */
export const calculateMonthlyTargetHours = (schedule: WorkSchedule, month: Date): number => {
  try {
    const days = eachDayOfInterval({
      start: startOfMonth(month),
      end: endOfMonth(month)
    });
    
    return days.reduce((total, day) => {
      const weekday = getWorkdaysInMonth(day);
      const dayHours = schedule.weekDays[weekday] || 0;
      return total + dayHours;
    }, 0);
  } catch (error) {
    console.error("Error calculating monthly target hours:", error);
    return 0;
  }
};

/**
 * Calculate adjusted fortnight hours based on schedule
 */
export const calculateAdjustedFortnightHours = (
  schedule: WorkSchedule, 
  date: Date
): number => {
  try {
    const fortnightWeek = getFortnightWeek(date);
    return calculateFortnightHoursFromSchedule(schedule, fortnightWeek);
  } catch (error) {
    console.error("Error calculating adjusted fortnight hours:", error);
    return 0;
  }
};

/**
 * Re-export the fortnight hours calculation from scheduleUtils for convenience
 */
export { calculateFortnightHoursFromSchedule };
