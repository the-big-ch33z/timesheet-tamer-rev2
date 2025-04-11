
import { USER_DEFAULTS } from "@/constants/defaults";

export interface UserMetrics {
  fte: number;
  fortnightHours: number;
  workScheduleId?: string;
}

export interface UserMetricsContextType {
  getUserMetrics: (userId: string) => UserMetrics;
  updateUserMetrics: (userId: string, metrics: Partial<UserMetrics>) => Promise<void>;
  resetUserMetrics: (userId: string) => Promise<void>;
}

export const DEFAULT_USER_METRICS: UserMetrics = {
  fte: USER_DEFAULTS.FTE,
  fortnightHours: USER_DEFAULTS.FORTNIGHT_HOURS,
  workScheduleId: USER_DEFAULTS.WORK_SCHEDULE_ID
};
