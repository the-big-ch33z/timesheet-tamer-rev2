
/**
 * TOIL types that are used across multiple modules
 * Extracted to prevent circular dependencies
 */

// Export TOILDayInfo interface
export interface TOILDayInfo {
  hasAccrued: boolean;
  hasUsed: boolean;
  toilHours: number;
}

// Export PendingTOILCalculation interface
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { TOILSummary } from "@/types/toil";

export interface PendingTOILCalculation {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule: WorkSchedule;
  holidays: Holiday[];
  resolve: (summary: TOILSummary | null) => void;
  reject?: (error: Error) => void;
}
