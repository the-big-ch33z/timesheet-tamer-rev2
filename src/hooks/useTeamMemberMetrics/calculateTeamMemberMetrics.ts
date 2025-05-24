
import { User, TimeEntry, WorkSchedule } from '@/types';
import { calculateMonthlyTargetHours } from '@/utils/time/calculations/hoursCalculations';
import { calculateFortnightHoursFromSchedule } from '@/utils/time/scheduleUtils';
import { toilService } from '@/utils/time/services/toil';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('calculateTeamMemberMetrics');

export interface UserMetrics {
  fte: number;
  fortnightHours: number;
  workScheduleId?: string;
}

export interface TeamMemberMetrics {
  userId: string;
  requiredHours: number;
  actualHours: number;
  toilBalance: number;
  loading: boolean;
}

/**
 * Pure function to calculate metrics for a single team member
 * Does not use any React hooks - all data must be passed as parameters
 */
export function calculateTeamMemberMetrics(
  user: User,
  entries: TimeEntry[],
  selectedMonth: Date,
  userMetrics: UserMetrics,
  workSchedule?: WorkSchedule
): TeamMemberMetrics {
  try {
    // Filter entries for this user and selected month
    const userEntries = entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entry.userId === user.id &&
             entryDate.getMonth() === selectedMonth.getMonth() && 
             entryDate.getFullYear() === selectedMonth.getFullYear();
    });

    // Calculate actual hours from entries
    const actualHours = userEntries.reduce((total, entry) => total + (entry.hours || 0), 0);

    // Calculate required hours
    let fortnightHours = userMetrics.fortnightHours || 76; // Default
    const userFte = userMetrics.fte || 1.0;
    
    if (workSchedule) {
      // Calculate adjusted fortnight hours based on schedule and FTE
      fortnightHours = calculateFortnightHoursFromSchedule(workSchedule) * userFte;
    }
    
    const requiredHours = calculateMonthlyTargetHours(fortnightHours, selectedMonth, workSchedule);

    // Get TOIL balance
    const monthYear = format(selectedMonth, 'yyyy-MM');
    let toilBalance = 0;
    try {
      const toilSummary = toilService.getTOILSummary(user.id, monthYear);
      toilBalance = toilSummary?.remaining || 0;
    } catch (error) {
      logger.error(`Failed to get TOIL balance for user ${user.id}`, error);
    }

    logger.debug(`Calculated metrics for ${user.name}:`, {
      requiredHours,
      actualHours,
      toilBalance,
      entriesCount: userEntries.length
    });

    return {
      userId: user.id,
      requiredHours,
      actualHours,
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
