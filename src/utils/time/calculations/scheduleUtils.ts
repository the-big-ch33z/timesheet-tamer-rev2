
import { WorkSchedule } from '@/types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('scheduleUtils');

export const calculateAdjustedFortnightHours = (schedule: WorkSchedule, fte: number = 1.0): number => {
  const baseHours = calculateFortnightHoursFromSchedule(schedule);
  return Math.round((baseHours * fte) * 2) / 2; // Round to nearest 0.5
};

export const calculateFortnightHoursFromSchedule = (schedule: WorkSchedule): number => {
  if (!schedule) return 0;
  
  let totalHours = 0;
  
  // Loop through each week in the schedule
  Object.entries(schedule.weeks).forEach(([weekNum, week]) => {
    const weekNumber = parseInt(weekNum) as 1 | 2;
    
    // Loop through each day in the week
    Object.entries(week).forEach(([day, dayConfig]) => {
      // Skip if it's a non-working day or an RDO
      if (!dayConfig || schedule.rdoDays[weekNumber].includes(day)) {
        return;
      }
      
      const startTime = new Date(`1970-01-01T${dayConfig.startTime}`);
      const endTime = new Date(`1970-01-01T${dayConfig.endTime}`);
      
      // Calculate hours difference
      let hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Subtract breaks if configured
      if (dayConfig.breaks?.lunch) {
        hours -= 0.5; // 30 min lunch break
      }
      
      if (dayConfig.breaks?.smoko) {
        hours -= 0.25; // 15 min smoko break
      }
      
      totalHours += Math.max(0, hours);
      
      logger.debug(`Day ${day} in week ${weekNum}: +${hours} hours`);
    });
  });
  
  logger.debug(`Total fortnight hours calculated: ${totalHours}`);
  return totalHours;
};
