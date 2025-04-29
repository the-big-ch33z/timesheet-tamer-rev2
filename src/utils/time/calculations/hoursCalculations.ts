import { calculateFortnightHoursFromSchedule } from "../scheduleUtils";
import { TimeCalculationError } from "../errors/timeErrorHandling";
import { getWorkdaysInMonth, getFortnightWeek } from "../scheduleUtils";
import { WorkSchedule, WeekDay } from "@/types";
import { eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";

/**
 * Normalize a time string to HH:mm format
 */
const normalizeTime = (time: string) => (time.includes(":") ? time : `${time}:00`);

/**
 * Calculate hours difference between two time strings (HH:MM format)
 */
export const calculateHoursFromTimes = (start: string, end: string): number => {
  if (!start || !end) return 0;

  try {
    const normalizedStart = normalizeTime(start);
    const normalizedEnd = normalizeTime(end);

    const [startHour, startMinute] = normalizedStart.split(':').map(Number);
    const [endHour, endMinute] = normalizedEnd.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      throw new TimeCalculationError("Invalid time format");
    }

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const diffMinutes = endTotalMinutes - startTotalMinutes;

    return diffMinutes / 60;
  } catch (error) {
    throw new TimeCalculationError(`Failed to calculate hours from ${start} to ${end}: ${error}`);
  }
};
