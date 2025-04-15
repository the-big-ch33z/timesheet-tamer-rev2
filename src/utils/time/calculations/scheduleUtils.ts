
import { WorkSchedule } from '@/types';

export const calculateAdjustedFortnightHours = (schedule: WorkSchedule, fte: number = 1.0): number => {
  const baseHours = calculateFortnightHoursFromSchedule(schedule);
  return Math.round((baseHours * fte) * 2) / 2; // Round to nearest 0.5
};

export const calculateFortnightHoursFromSchedule = (schedule: WorkSchedule): number => {
  let totalHours = 0;
  
  // Loop through each week in the schedule
  Object.values(schedule.weeks).forEach(week => {
    // Loop through each day in the week
    Object.values(week).forEach(day => {
      if (day) {
        const startTime = new Date(`1970-01-01T${day.startTime}`);
        const endTime = new Date(`1970-01-01T${day.endTime}`);
        
        // Calculate hours difference
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });
  });
  
  return totalHours;
};
