
import { TimeEntry } from '@/types';
import { format, startOfWeek, addDays } from 'date-fns';

export interface JobNumberSummary {
  jobNumber: string;
  rego?: string;
  hours: number;
}

export const calculateTotalHours = (entries: TimeEntry[]): number => {
  return entries.reduce((total, entry) => total + (entry.hours || 0), 0);
};

export const aggregateEntriesByJobNumber = (entries: TimeEntry[]): JobNumberSummary[] => {
  const aggregated = new Map<string, JobNumberSummary>();

  entries.forEach(entry => {
    if (!entry.jobNumber) return;
    
    const key = `${entry.jobNumber}-${entry.rego || ''}`;
    const existing = aggregated.get(key);
    
    if (existing) {
      existing.hours += entry.hours || 0;
    } else {
      aggregated.set(key, {
        jobNumber: entry.jobNumber,
        rego: entry.rego,
        hours: entry.hours || 0
      });
    }
  });

  return Array.from(aggregated.values())
    .sort((a, b) => b.hours - a.hours);
};

export const aggregateWeeklyData = (entries: TimeEntry[]) => {
  if (!entries.length) return [];

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekData: Record<string, Record<string, number>> = {};

  // Initialize days
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const dayKey = format(day, 'EEE');
    weekData[dayKey] = {};
  }

  // Aggregate entries by day and project
  entries.forEach(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    const dayKey = format(entryDate, 'EEE');
    
    if (!weekData[dayKey]) return;

    const projectKey = `${entry.jobNumber || 'No Job'}${entry.rego ? ` - ${entry.rego}` : ''}`;
    weekData[dayKey][projectKey] = (weekData[dayKey][projectKey] || 0) + (entry.hours || 0);
  });

  // Transform to chart format
  return Object.entries(weekData).map(([day, projects]) => ({
    day,
    ...projects
  }));
};
