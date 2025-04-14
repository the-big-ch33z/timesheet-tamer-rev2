
import { WorkSchedule } from "@/types";
import { format } from "date-fns";
import { getWeekDay, getFortnightWeek } from "../scheduleUtils";

/**
 * Validates that a time string is in correct format
 */
export function validateTimeFormat(time: string): { valid: boolean; message?: string } {
  if (!time) {
    return { valid: false, message: "Time is required" };
  }

  // Check if it matches the HH:MM pattern
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    return { valid: false, message: "Time must be in format HH:MM (24-hour)" };
  }

  return { valid: true };
}

/**
 * Validates that start time is before end time
 */
export function validateTimeOrder(
  startTime: string,
  endTime: string
): { valid: boolean; message?: string } {
  if (!startTime || !endTime) {
    return { valid: true }; // Can't validate order if one is missing
  }

  const start = startTime.split(":");
  const end = endTime.split(":");

  const startHour = parseInt(start[0]);
  const startMin = parseInt(start[1]);
  const endHour = parseInt(end[0]);
  const endMin = parseInt(end[1]);

  if (
    startHour > endHour ||
    (startHour === endHour && startMin >= endMin)
  ) {
    return {
      valid: false,
      message: "End time must be after start time",
    };
  }

  return { valid: true };
}

/**
 * Comprehensive time validation against a work schedule
 */
export function validateTime(
  time: string,
  otherTime: string,
  date: Date,
  workSchedule?: WorkSchedule
): { valid: boolean; message?: string } {
  // Basic format validation
  const formatValidation = validateTimeFormat(time);
  if (!formatValidation.valid) {
    return formatValidation;
  }

  // If no work schedule, just do basic validation
  if (!workSchedule) {
    if (!otherTime) {
      return { valid: true };
    }
    return validateTimeOrder(
      time < otherTime ? time : otherTime,
      time < otherTime ? otherTime : time
    );
  }

  // With work schedule, do more sophisticated validation
  // This has been simplified to just check the time order since we're deprecating work schedule dependency
  if (otherTime) {
    return validateTimeOrder(
      time < otherTime ? time : otherTime,
      time < otherTime ? otherTime : time
    );
  }

  return { valid: true };
}
