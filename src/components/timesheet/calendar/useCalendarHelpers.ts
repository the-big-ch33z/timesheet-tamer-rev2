
import { useMemo, useCallback } from "react";
import { WorkSchedule } from "@/types";
import { isWeekend, isToday } from "date-fns";
import { isWorkingDay } from "@/utils/time/scheduleUtils";
import { getWeekDay, getFortnightWeek } from "@/utils/time/scheduleUtils";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";

const logger = createTimeLogger('useCalendarHelpers');

// Cache for start and end times based on date
const startEndTimeCache = new Map<string, { startTime?: string, endTime?: string }>();

/**
 * Helper hook for calendar functionality with improved performance
 */
export const useCalendarHelpers = (workSchedule?: WorkSchedule) => {
  /**
   * Memoized function to check if a date is a working day
   */
  const checkIsWorkingDay = useCallback((day: Date) => {
    return !isWeekend(day) || (workSchedule ? isWorkingDay(day, workSchedule) : false);
  }, [workSchedule]);

  /**
   * Optimized version that gets various calendar state information for a day
   */
  const getDayState = useCallback((
    day: Date, 
    selectedDay: Date | null, 
    monthStart: Date
  ) => {
    // Don't calculate these values every time if they're static properties of the date
    const cacheKey = `${day.getTime()}-${workSchedule?.id || 'no-schedule'}`;
    
    // Create result
    return {
      isToday: isToday(day),
      isSelected: selectedDay ? day.toDateString() === selectedDay.toDateString() : false,
      isCurrentMonth: day.getMonth() === monthStart.getMonth(),
      isWeekend: isWeekend(day),
      isWorkingDay: checkIsWorkingDay(day),
      weekday: getWeekDay(day),
      fortnightWeek: getFortnightWeek(day)
    };
  }, [workSchedule, checkIsWorkingDay]);
  
  /**
   * Optimized function to get start and end time from work schedule with caching
   */
  const getStartAndEndTimeForDay = useCallback((day: Date) => {
    if (!workSchedule) {
      return { startTime: undefined, endTime: undefined };
    }
    
    // Create a cache key based on the date and schedule ID
    const cacheKey = `${format(day, 'yyyy-MM-dd')}-${workSchedule.id}`;
    
    // Check cache first
    if (startEndTimeCache.has(cacheKey)) {
      return startEndTimeCache.get(cacheKey) as { startTime?: string, endTime?: string };
    }

    try {
      const weekday = getWeekDay(day);
      const fortnightWeek = getFortnightWeek(day);
      
      // Check if the day exists in the work schedule and is not an RDO
      if (
        workSchedule.weeks[fortnightWeek] && 
        workSchedule.weeks[fortnightWeek][weekday] &&
        !workSchedule.rdoDays[fortnightWeek].includes(weekday)
      ) {
        const dayConfig = workSchedule.weeks[fortnightWeek][weekday];
        const result = {
          startTime: dayConfig?.startTime,
          endTime: dayConfig?.endTime
        };
        
        // Store in cache
        startEndTimeCache.set(cacheKey, result);
        return result;
      }
      
      // Cache negative results too
      const emptyResult = { startTime: undefined, endTime: undefined };
      startEndTimeCache.set(cacheKey, emptyResult);
      return emptyResult;
    } catch (error) {
      logger.error(`Error getting schedule for ${format(day, 'yyyy-MM-dd')}:`, error);
      return { startTime: undefined, endTime: undefined };
    }
  }, [workSchedule]);
  
  // For backward compatibility
  const getDayStatus = getDayState;

  // Clear cache when workSchedule changes
  useMemo(() => {
    // Only clean cache when workSchedule changes
    if (workSchedule) {
      startEndTimeCache.clear();
      logger.debug('Cleared start/end time cache due to schedule change');
    }
    return null;
  }, [workSchedule]);

  return { 
    getDayState, 
    getDayStatus, 
    checkIsWorkingDay, 
    getStartAndEndTimeForDay 
  };
};
