
import { useMemo, useCallback } from "react";
import { WorkSchedule } from "@/types";
import { isWeekend, isToday } from "date-fns";
import { isWorkingDay, isRDODay } from "@/utils/time/scheduleUtils";
import { getWeekDay, getFortnightWeek } from "@/utils/time/scheduleUtils";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";
import { Holiday, getHolidays } from "@/lib/holidays";
import { getShiftedRDODate } from "@/utils/time/rdoDisplay";

const logger = createTimeLogger('useCalendarHelpers');

// Cache for start and end times based on date
const startEndTimeCache = new Map<string, { startTime?: string, endTime?: string }>();

interface DayStateResult {
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isWorkingDay: boolean;
  isRDO: boolean;
  isShiftedRDO: boolean;
  weekday: string;
  fortnightWeek: 1 | 2;
  originalRdoDate?: Date;
  shiftReason?: string | null;
}

/**
 * Helper hook for calendar functionality with improved performance
 */
export const useCalendarHelpers = (workSchedule?: WorkSchedule) => {
  const holidays = useMemo(() => getHolidays(), []);

  /**
   * Memoized function to check if a date is a working day
   */
  const checkIsWorkingDay = useCallback((day: Date) => {
    return !isWeekend(day) || (workSchedule ? isWorkingDay(day, workSchedule) : false);
  }, [workSchedule]);

  /**
   * Check if a day is an RDO with enhanced caching
   */
  const checkIsRDO = useCallback((day: Date) => {
    // Use the isRDODay utility function for consistent RDO detection
    return workSchedule ? isRDODay(day, workSchedule) : false;
  }, [workSchedule]);

  /**
   * Get RDO shift information for a date if needed
   */
  const getRDOShiftInfo = useCallback(
    (day: Date): { isShifted: boolean; originalDate?: Date; reason?: string } => {
      if (!workSchedule || !checkIsRDO(day)) {
        return { isShifted: false };
      }

      // Check if this RDO needs to be shifted due to holiday or weekend
      const shiftInfo = getShiftedRDODate(day, holidays);
      if (shiftInfo.shifted) {
        return {
          isShifted: true,
          originalDate: day, // This is the original date when checking the source day
          reason: shiftInfo.reason || undefined,
        };
      }

      return { isShifted: false };
    },
    [workSchedule, checkIsRDO, holidays]
  );

  /**
   * Optimized version that gets various calendar state information for a day
   */
  const getDayState = useCallback(
    (day: Date, selectedDay: Date | null, monthStart: Date): DayStateResult => {
      const isRDO = checkIsRDO(day);
      const shiftInfo = isRDO ? getRDOShiftInfo(day) : { isShifted: false };
      
      // Create result
      return {
        isToday: isToday(day),
        isSelected: selectedDay ? day.toDateString() === selectedDay.toDateString() : false,
        isCurrentMonth: day.getMonth() === monthStart.getMonth(),
        isWeekend: isWeekend(day),
        isWorkingDay: checkIsWorkingDay(day),
        isRDO,
        isShiftedRDO: shiftInfo.isShifted,
        weekday: getWeekDay(day),
        fortnightWeek: getFortnightWeek(day),
        originalRdoDate: shiftInfo.isShifted ? shiftInfo.originalDate : undefined,
        shiftReason: shiftInfo.reason || null
      };
    },
    [workSchedule, checkIsWorkingDay, checkIsRDO, getRDOShiftInfo]
  );
  
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
    checkIsRDO,
    getRDOShiftInfo,
    getStartAndEndTimeForDay 
  };
};
