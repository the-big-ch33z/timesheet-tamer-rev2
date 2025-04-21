
/**
 * Time Off In Lieu (TOIL) types for tracking extra hours worked
 * 
 * TOIL hours must always be a positive number between 0 and 24 (inclusive).
 * Attempts to create or use TOIL with invalid hours will be rejected.
 */

export interface TOILRecord {
  id: string;
  userId: string;
  date: Date;
  /**
   * Accrued hours (0 <= hours <= 24).
   */
  hours: number;
  monthYear: string; // Format: 'yyyy-MM'
  entryId?: string; // Reference to the original timesheet entry
  status: 'active' | 'expired' | 'used';
}

export interface TOILUsage {
  id: string;
  userId: string;
  date: Date;
  /**
   * Hours used (0 <= hours <= 24).
   */
  hours: number;
  entryId: string; // Reference to the timesheet entry marked as "TOIL"
  monthYear: string; // Format: 'yyyy-MM'
}

export interface TOILSummary {
  userId: string;
  monthYear: string;
  accrued: number;
  used: number;
  remaining: number;
}

// Special job number to identify TOIL usage
export const TOIL_JOB_NUMBER = "TOIL";
