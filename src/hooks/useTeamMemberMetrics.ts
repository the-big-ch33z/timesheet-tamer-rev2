
import { useState, useEffect, useMemo } from 'react';
import { User, TimeEntry } from '@/types';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context/TimeEntryContext';
import { useUserMetrics } from '@/contexts/user-metrics';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { calculateTeamMemberMetrics, TeamMemberMetrics } from './useTeamMemberMetrics/calculateTeamMemberMetrics';

export { type TeamMemberMetrics } from './useTeamMemberMetrics/calculateTeamMemberMetrics';

export function useTeamMemberMetrics(
  teamMembers: User[],
  selectedMonth: Date = new Date()
) {
  const [metrics, setMetrics] = useState<Record<string, TeamMemberMetrics>>({});
  const timeEntryContext = useTimeEntryContext();
  const { getUserMetrics } = useUserMetrics();
  const { getScheduleById } = useWorkSchedule();
  
  // Pre-fetch all user metrics and work schedules at the top level
  const userMetricsMap = useMemo(() => {
    const metricsMap = new Map();
    teamMembers.forEach(member => {
      const userMetrics = getUserMetrics(member.id);
      metricsMap.set(member.id, userMetrics);
    });
    return metricsMap;
  }, [teamMembers, getUserMetrics]);

  const workScheduleMap = useMemo(() => {
    const scheduleMap = new Map();
    teamMembers.forEach(member => {
      const userMetrics = userMetricsMap.get(member.id);
      if (userMetrics?.workScheduleId) {
        const workSchedule = getScheduleById(userMetrics.workScheduleId);
        scheduleMap.set(member.id, workSchedule);
      }
    });
    return scheduleMap;
  }, [teamMembers, userMetricsMap, getScheduleById]);

  // Calculate metrics for each team member using the pure function
  const calculatedMetrics = useMemo(() => {
    const newMetrics: Record<string, TeamMemberMetrics> = {};
    
    teamMembers.forEach(member => {
      // Get entries for this user for the selected month
      let entries: TimeEntry[] = [];
      if (timeEntryContext?.getMonthEntries) {
        entries = timeEntryContext.getMonthEntries(selectedMonth, member.id);
      }
      
      // Get pre-fetched user metrics and work schedule
      const userMetrics = userMetricsMap.get(member.id);
      const workSchedule = workScheduleMap.get(member.id);
      
      // Use the pure calculation function
      newMetrics[member.id] = calculateTeamMemberMetrics(
        member,
        entries,
        selectedMonth,
        userMetrics,
        workSchedule
      );
    });
    
    return newMetrics;
  }, [teamMembers, selectedMonth, timeEntryContext, userMetricsMap, workScheduleMap]);
  
  // Update state when calculated metrics change
  useEffect(() => {
    setMetrics(calculatedMetrics);
  }, [calculatedMetrics]);
  
  return { metrics };
}
