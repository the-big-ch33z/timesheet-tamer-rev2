
import { TimeEntry, WorkSchedule } from "@/types";

export interface BreakConfig {
  lunch: boolean;
  smoko: boolean;
}

export interface WorkHoursInterfaceProps {
  date: Date;
  userId: string;
  entries: TimeEntry[];
  interactive?: boolean;
  workSchedule?: WorkSchedule;
  onHoursChange?: (hours: number) => void;
}
