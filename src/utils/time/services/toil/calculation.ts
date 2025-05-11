
import { TimeEntry } from "@/types";
import { TOILBalanceEntry, TOILUsageEntry } from "./service";
import { createTimeLogger } from "../../errors/timeLogger";

const logger = createTimeLogger('toil-calculation');

/**
 * Calculate TOIL balance for a user
 * @param userId User ID to calculate balance for
 * @param accrued Time accrued in hours
 * @param used Time used in hours
 */
export const calculateTOILBalance = (
  userId: string, 
  accrued: number = 0, 
  used: number = 0
): number => {
  const balance = accrued - used;
  return Math.max(0, balance); // Balance cannot be negative
};

/**
 * Calculate TOIL accrual for entries
 * @param entries Time entries to calculate accrual from
 * @param toilJobNumber Job number used for TOIL entries
 */
export const calculateTOILAccrual = (
  entries: TimeEntry[], 
  toilJobNumber: string
): number => {
  if (!entries || entries.length === 0) {
    return 0;
  }

  return entries
    .filter(entry => entry.jobNumber === toilJobNumber)
    .reduce((total, entry) => total + (typeof entry.hours === 'number' ? entry.hours : 0), 0);
};

/**
 * Get available TOIL hours for a user
 * @param userId User ID
 * @param date Optional date to check
 */
export const getAvailableTOILHours = (
  userId: string,
  date?: Date
): number => {
  try {
    // This is a simplified implementation
    // In real app, this would query storage for actual balance
    const accrued = 0; // Get from storage
    const used = 0;    // Get from storage
    
    return calculateTOILBalance(userId, accrued, used);
  } catch (error) {
    logger.error('Error getting available TOIL hours:', error);
    return 0;
  }
};
