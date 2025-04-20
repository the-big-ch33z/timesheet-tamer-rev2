
import { TimeEntry } from "@/types";

export const validateTimeEntry = (entry: Partial<TimeEntry>): { valid: boolean; message?: string } => {
  if (!entry.hours || entry.hours <= 0) {
    return {
      valid: false,
      message: "Hours must be greater than 0"
    };
  }

  if (!entry.date) {
    return {
      valid: false,
      message: "Date is required"
    };
  }

  return { valid: true };
};

// Add these exported functions to fix references in other files
export const autoCalculateHours = (startTime: string, endTime: string): number => {
  // Simple implementation to calculate hours between times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  const minutes = endMinute - startMinute;
  
  // Adjust for minutes
  hours += minutes / 60;
  
  // Ensure positive value
  return Math.max(0, parseFloat(hours.toFixed(2)));
};

export const calculateTotalHours = (entries: TimeEntry[]): number => {
  return entries.reduce((total, entry) => total + (entry.hours || 0), 0);
};
