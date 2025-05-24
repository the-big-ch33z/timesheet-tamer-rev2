
import { useState, useEffect, useMemo } from 'react';
import { User, TimeEntry } from '@/types';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context/TimeEntryContext';
import { useUserMetrics } from '@/contexts/user-metrics';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { useMonthlyHoursCalculation } from '@/hooks/useMonthlyHoursCalculation';
import { toilService } from '@/utils/time/services/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { format } from 'date-fns';

const logger = createTimeLogger('useTeamMemberMetrics');

export interface TeamMemberMetrics {
  userId: string;
  requiredHours: number;
  actualHours: number;
  toilBalance: number;
  loading: boolean;
}

export function useTeamMemberMetrics(
  teamMembers: User[],
  selectedMonth: Date = new Date()
) {
  const [metrics, setMetrics] = useState<Record<string, TeamMemberMetrics>>({});
  const timeEntryContext = useTimeEntryContext();
  const { getUserMetrics } = useUserMetrics();
  const { getScheduleById } = useWorkSchedule();
  
  // Calculate metrics for each team member
  const calculatedMetrics = useMemo(() => {
    const newMetrics: Record<string, TeamMemberMetrics> = {};
    
    teamMembers.forEach(member => {
      try {
        // Get entries for this user for the selected month
        let entries: TimeEntry[] = [];
        if (timeEntryContext?.getMonthEntries) {
          entries = timeEntryContext.getMonthEntries(selectedMonth, member.id);
        }
        
        // Get user metrics and work schedule
        const userMetrics = getUserMetrics(member.id);
        const workSchedule = userMetrics.workScheduleId ? getScheduleById(userMetrics.workScheduleId) : undefined;
        
        // Calculate monthly hours
        const { targetHours, hours } = useMonthlyHoursCalculation(
          entries,
          selectedMonth,
          member,
          workSchedule
        );
        
        // Get TOIL balance
        const monthYear = format(selectedMonth, 'yyyy-MM');
        let toilBalance = 0;
        try {
          const toilSummary = toilService.getTOILSummary(member.id, monthYear);
          toilBalance = toilSummary?.remaining || 0;
        } catch (error) {
          logger.error(`Failed to get TOIL balance for user ${member.id}`, error);
        }
        
        newMetrics[member.id] = {
          userId: member.id,
          requiredHours: targetHours,
          actualHours: hours,
          toilBalance,
          loading: false
        };
        
        logger.debug(`Calculated metrics for ${member.name}:`, {
          requiredHours: targetHours,
          actualHours: hours,
          toilBalance,
          entriesCount: entries.length
        });
        
      } catch (error) {
        logger.error(`Failed to calculate metrics for user ${member.id}`, error);
        newMetrics[member.id] = {
          userId: member.id,
          requiredHours: 0,
          actualHours: 0,
          toilBalance: 0,
          loading: false
        };
      }
    });
    
    return newMetrics;
  }, [teamMembers, selectedMonth, timeEntryContext, getUserMetrics, getScheduleById]);
  
  // Update state when calculated metrics change
  useEffect(() => {
    setMetrics(calculatedMetrics);
  }, [calculatedMetrics]);
  
  return { metrics };
}
