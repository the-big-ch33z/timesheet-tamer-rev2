
import { TimeEntry, WorkSchedule } from "@/types";
import { TOILSummary } from "@/types/toil";
import { Holiday } from "@/lib/holidays";

// Storage keys
export const TOIL_RECORDS_KEY = 'toilRecords';
export const TOIL_USAGE_KEY = 'toilUsage';
export const TOIL_SUMMARY_CACHE_KEY = 'toilSummaryCache';

// TOIL job number constant
export const TOIL_JOB_NUMBER = "TOIL";

// Interface for pending TOIL calculation
export interface PendingTOILCalculation {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule: WorkSchedule;
  holidays: Holiday[];
  resolve: (summary: TOILSummary | null) => void;
}
