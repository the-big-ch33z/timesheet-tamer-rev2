
export interface BreakConfig {
  lunch: boolean;
  smoko: boolean;
}

export interface WorkHoursState {
  startTime: string;
  endTime: string;
  isCustom: boolean;
  hasData?: boolean;
  calculatedHours?: number;
}
