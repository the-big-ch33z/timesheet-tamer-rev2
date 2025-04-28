
import { useCallback, useMemo } from 'react';
import { WorkSchedule } from '@/types';
import { getWeekDay, getFortnightWeek, calculateDayHoursWithBreaks } from '@/utils/time/scheduleUtils';

export const useWorkHoursCalculation = (date: Date, workSchedule?: WorkSchedule) => {
  const calculateDayHours = useCallback(() => {
    if (!workSchedule) return 7.6;
    
    const weekday = getWeekDay(date);
    const fortnightWeek = getFortnightWeek(date);
    const dayConfig = workSchedule.weeks[fortnightWeek]?.[weekday];
    
    if (!dayConfig || !dayConfig.startTime || !dayConfig.endTime) {
      return 7.6;
    }
    
    return calculateDayHoursWithBreaks(
      dayConfig.startTime, 
      dayConfig.endTime, 
      { 
        lunch: !!dayConfig.breaks?.lunch, 
        smoko: !!dayConfig.breaks?.smoko 
      }
    );
  }, [workSchedule, date]);

  const breakConfig = useMemo(() => {
    if (!workSchedule) return { lunch: false, smoko: false };
    const weekday = getWeekDay(date);
    const fortnightWeek = getFortnightWeek(date);
    const dayConfig = workSchedule.weeks[fortnightWeek]?.[weekday];
    return {
      lunch: !!(dayConfig?.breaks?.lunch),
      smoko: !!(dayConfig?.breaks?.smoko),
    };
  }, [workSchedule, date]);

  return {
    calculateDayHours,
    breakConfig,
    hasLunchBreakInSchedule: breakConfig.lunch,
    hasSmokoBreakInSchedule: breakConfig.smoko
  };
};
