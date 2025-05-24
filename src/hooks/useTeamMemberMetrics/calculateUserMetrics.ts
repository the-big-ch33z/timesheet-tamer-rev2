
import { User, TimeEntry } from '@/types';
import { useMonthlyHoursCalculation } from '@/hooks/useMonthlyHoursCalculation';
import { useUserMetrics } from '@/contexts/user-metrics';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { toilService } from '@/utils/time/services/toil';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('calculateUserMetrics');

export interface UserMetricsResult {
  userId: string;
  requiredHours: number;
  actualHours: number;
  toilBalance: number;
  loading: boolean;
}

export function calculateUserMetrics(
  user: User,
  entries: TimeEntry[],
  selectedMonth: Date
): UserMetricsResult {
  const { getUserMetrics } = useUserMetrics();
  const { getScheduleById } = useWorkSchedule();
  
  try {
    // Get user metrics and work schedule
    const userMetrics = getUserMetrics(user.id);
    const workSchedule = userMetrics.workScheduleId ? getScheduleById(userMetrics.workScheduleId) : undefined;
    
    // Calculate monthly hours using the existing hook logic
    const { targetHours, hours } = useMonthlyHoursCalculation(
      entries,
      selectedMonth,
      user,
      workSchedule
    );
    
    // Get TOIL balance
    const monthYear = format(selectedMonth, 'yyyy-MM');
    let toilBalance = 0;
    try {
      const toilSummary = toilService.getTOILSummary(user.id, monthYear);
      toilBalance = toilSummary?.remaining || 0;
    } catch (error) {
      logger.error(`Failed to get TOIL balance for user ${user.id}`, error);
    }
    
    return {
      userId: user.id,
      requiredHours: targetHours,
      actualHours: hours,
      toilBalance,
      loading: false
    };
  } catch (error) {
    logger.error(`Failed to calculate metrics for user ${user.id}`, error);
    return {
      userId: user.id,
      requiredHours: 0,
      actualHours: 0,
      toilBalance: 0,
      loading: false
    };
  }
}
