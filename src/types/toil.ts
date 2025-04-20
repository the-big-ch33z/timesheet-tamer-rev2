
/**
 * Time Off In Lieu (TOIL) types for tracking extra hours worked
 */

export interface TOILRecord {
  id: string;
  userId: string;
  date: Date;
  hours: number;
  monthYear: string; // Format: 'yyyy-MM'
  entryId?: string; // Reference to the original timesheet entry
  status: 'active' | 'expired' | 'used';
}

export interface TOILUsage {
  id: string;
  userId: string;
  date: Date;
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
