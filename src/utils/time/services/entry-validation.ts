
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
