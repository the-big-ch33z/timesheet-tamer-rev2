
import { TimeEntry, WorkSchedule } from "@/types";
import { TOILSummary } from "@/types/toil";
import { Holiday } from "@/lib/holidays";

// Interface for pending TOIL calculation
export interface PendingTOILCalculation {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule: WorkSchedule;
  holidays: Holiday[];
  resolve: (summary: TOILSummary | null) => void;
}

// Standardized interface for TOIL day info
export interface TOILDayInfo {
  hasAccrued: boolean;
  hasUsed: boolean;
  toilHours: number;
}
