
import { BreakConfig } from '@/contexts/timesheet/types';

export { BreakConfig };

export interface WorkHoursState {
  startTime: string;
  endTime: string;
  isCustom: boolean;
  hasData?: boolean;
  calculatedHours?: number;
}
