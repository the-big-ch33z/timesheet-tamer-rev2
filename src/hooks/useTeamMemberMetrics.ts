import { useState, useEffect } from 'react';
import { User, TimeEntry } from '@/types';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context/TimeEntryContext';
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
  const { getMonthEntries } = useTimeEntryContext();
  
  useEffect(() => {
    async function fetchMetricsForMembers() {
      const newMetrics: Record<string, TeamMemberMetrics> = {};
      
      // Initialize metrics for all team members
      teamMembers.forEach(member => {
        newMetrics[member.id] = {
          userId: member.id,
          requiredHours: 0,
          actualHours: 0,
          toilBalance: 0,
          loading: true
        };
      });
      
      // Update state with loading indicators
      setMetrics(newMetrics);
      
      // Process each team member
      for (const member of teamMembers) {
        try {
          // Get entries for this user for the selected month
          const entries = getMonthEntries(selectedMonth, member.id);
          
          // Calculate monthly hours
          const { targetHours, hours } = useMonthlyHoursCalculation(entries, selectedMonth, member);
          
          // Get TOIL balance - now handled synchronously
          const monthYear = format(selectedMonth, 'yyyy-MM');
          let toilBalance = 0;
          try {
            const toilSummary = toilService.getTOILSummary(member.id, monthYear);
            toilBalance = toilSummary?.remaining || 0;
          } catch (error) {
            logger.error(`Failed to get TOIL balance for user ${member.id}`, error);
          }
          
          // Update metrics for this member
          newMetrics[member.id] = {
            userId: member.id,
            requiredHours: targetHours,
            actualHours: hours,
            toilBalance: toilBalance,
            loading: false
          };
        } catch (error) {
          logger.error(`Failed to calculate metrics for user ${member.id}`, error);
          // Keep the entry but mark as not loading and with default values
          newMetrics[member.id] = {
            userId: member.id,
            requiredHours: 0,
            actualHours: 0,
            toilBalance: 0,
            loading: false
          };
        }
      }
      
      setMetrics(newMetrics);
    }
    
    if (teamMembers.length > 0) {
      fetchMetricsForMembers();
    }
    
  }, [teamMembers, selectedMonth, getMonthEntries]);
  
  return { metrics };
}
