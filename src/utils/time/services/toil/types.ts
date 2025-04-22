
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { TOILRecord, TOILSummary, TOILUsage } from "@/types/toil";

// Pending TOIL calculation request
export type PendingTOILCalculation = {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule?: WorkSchedule;
  holidays: Holiday[];
  resolve: (summary: TOILSummary | null) => void;
};

// Cache keys for TOIL service
export const TOIL_RECORDS_KEY = 'toilRecords';
export const TOIL_USAGE_KEY = 'toilUsage';
export { TOIL_JOB_NUMBER } from "@/types/toil";
