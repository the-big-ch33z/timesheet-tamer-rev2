
import { BreakConfig } from '@/contexts/timesheet/types';

export type { BreakConfig };

export interface WorkHoursState {
  startTime: string;
  endTime: string;
  isCustom: boolean;
  hasData?: boolean;
  calculatedHours?: number;
}
