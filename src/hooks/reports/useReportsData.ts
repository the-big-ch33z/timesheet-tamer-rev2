
import { useMemo } from 'react';
import { useUnifiedTimeEntries } from '@/hooks/timeEntries/useUnifiedTimeEntries';
import { useTimesheetContext } from '@/contexts/timesheet/TimesheetContext';
import { TimeEntry } from '@/types';
import { 
  getWeekDateRange, 
  getMonthDateRange, 
  isDateInRange 
} from '@/utils/reports/dateHelpers';
import { 
  aggregateEntriesByJobNumber,
  aggregateWeeklyData,
  calculateTotalHours 
} from '@/utils/reports/reportCalculations';

export interface ReportsData {
  thisWeekHours: number;
  thisMonthHours: number;
  topJobNumber: { jobNumber: string; hours: number } | null;
  weeklyChartData: Array<{
    day: string;
    [key: string]: number | string;
  }>;
  projectDistributionData: Array<{
    name: string;
    hours: number;
    percentage: number;
  }>;
  isLoading: boolean;
}

export const useReportsData = (): ReportsData => {
  const { entries, isLoading } = useUnifiedTimeEntries();
  const { viewedUser } = useTimesheetContext();
  
  const userId = viewedUser?.id || 'current-user';
  
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => entry.userId === userId);
  }, [entries, userId]);

  const reportsData = useMemo(() => {
    if (!filteredEntries.length) {
      return {
        thisWeekHours: 0,
        thisMonthHours: 0,
        topJobNumber: null,
        weeklyChartData: [],
        projectDistributionData: [],
        isLoading
      };
    }

    const now = new Date();
    const weekRange = getWeekDateRange(now);
    const monthRange = getMonthDateRange(now);

    // Filter entries for this week and month
    const thisWeekEntries = filteredEntries.filter(entry => 
      isDateInRange(entry.date, weekRange.start, weekRange.end)
    );
    
    const thisMonthEntries = filteredEntries.filter(entry => 
      isDateInRange(entry.date, monthRange.start, monthRange.end)
    );

    // Calculate weekly and monthly totals
    const thisWeekHours = calculateTotalHours(thisWeekEntries);
    const thisMonthHours = calculateTotalHours(thisMonthEntries);

    // Find top job number by total hours
    const jobNumberHours = aggregateEntriesByJobNumber(thisMonthEntries);
    const topJobNumber = jobNumberHours.length > 0 ? jobNumberHours[0] : null;

    // Generate weekly chart data
    const weeklyChartData = aggregateWeeklyData(thisWeekEntries);

    // Generate project distribution data
    const projectDistributionData = jobNumberHours.slice(0, 10).map(item => ({
      name: `${item.jobNumber}${item.rego ? ` - ${item.rego}` : ''}`,
      hours: item.hours,
      percentage: thisMonthHours > 0 ? Math.round((item.hours / thisMonthHours) * 100) : 0
    }));

    return {
      thisWeekHours,
      thisMonthHours,
      topJobNumber,
      weeklyChartData,
      projectDistributionData,
      isLoading
    };
  }, [filteredEntries, isLoading]);

  return reportsData;
};
