
import { TimeEntry, WorkSchedule } from "@/types";
import { TOILSummary } from "@/types/toil";
import { Holiday } from "@/lib/holidays";

/**
 * Interface for pending TOIL calculation tasks
 */
export interface PendingTOILCalculation {
  entries: TimeEntry[];
  date: Date;
  userId: string;
  workSchedule?: WorkSchedule;
  holidays: Holiday[];
  resolve: (summary: TOILSummary | null) => void;
  reject?: (error: Error) => void;
}

/**
 * Base TOIL service implementation interface
 */
export interface TOILServiceInterface {
  initialize(): void;
  isInitialized(): boolean;
  clearCache(): void;
  
  // TOIL calculation methods
  calculateTOIL(entries: TimeEntry[], date: Date, userId: string): Promise<number>;
  
  // TOIL summary methods
  getTOILSummary(userId: string, monthYear: string): TOILSummary | null;
  
  // Queue management
  getQueueLength(): number;
  isQueueProcessing(): boolean;
}
