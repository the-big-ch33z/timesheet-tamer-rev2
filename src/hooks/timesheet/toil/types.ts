
import { TimeEntry } from '@/types';
import { TOILSummary } from '@/types/toil';
import { WorkSchedule } from '@/types';

export interface UseTOILEntryCheckerResult {
  isToilEntry: (entry: TimeEntry) => boolean;
}

export interface UseTOILStateProps {
  userId: string;
  date: Date;
  workSchedule?: WorkSchedule;
}

export interface UseTOILStateResult {
  toilSummary: TOILSummary | null;
  setToilSummary: (summary: TOILSummary | null) => void;
  isCalculating: boolean;
  setIsCalculating: (isCalculating: boolean) => void;
}

export interface UseTOILCalculatorProps {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule?: WorkSchedule;
  isCalculating: boolean;
  setIsCalculating: (isCalculating: boolean) => void;
  setToilSummary: (summary: TOILSummary | null) => void;
}

export interface UseTOILCalculatorResult {
  calculateToilForDay: () => Promise<TOILSummary | null>;
}

export interface UseTOILCalculationsProps {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule?: WorkSchedule;
}

export interface UseTOILCalculationsResult {
  toilSummary: TOILSummary | null;
  isToilEntry: (entry: TimeEntry) => boolean;
  calculateToilForDay: () => Promise<TOILSummary | null>;
  isCalculating: boolean;
}
