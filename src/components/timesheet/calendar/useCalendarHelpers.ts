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

// Cache for day state calculations
const dayStateCache = new Map<string, any>();

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

const ONE_HOUR = 60 * 60 * 1000;
const CACHE_CLEAR_INTERVAL = ONE_HOUR;
let lastCacheClear = Date.now();

/**
 * Helper hook for calendar functionality with improved performance
 */
export const useCalendarHelpers = (workSchedule?: WorkSchedule) => {
  const holidays = useMemo(() => getHolidays(), []);

  // Clear caches periodically to prevent memory leaks
  useMemo(() => {
    const now = Date.now();
    if (now - lastCacheClear > CACHE_CLEAR_INTERVAL) {
      startEndTimeCache.clear();
      dayStateCache.clear();
      lastCacheClear = now;
    }
    return null;
  }, []);

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

      const dateKey = format(day, 'yyyy-MM-dd');
      const cacheKey = `shift-${dateKey}-${workSchedule?.id || 'none'}`;
      
      // Check cache
      const cachedData = dayStateCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Check if this RDO needs to be shifted due to holiday or weekend
      const shiftInfo = getShiftedRDODate(day, holidays);
      let result;
      
      if (shiftInfo.shifted) {
        result = {
          isShifted: true,
          originalDate: day, // This is the original date when checking the source day
          reason: shiftInfo.reason || undefined,
        };
      } else {
        result = { isShifted: false };
      }
      
      // Cache result
      dayStateCache.set(cacheKey, result);
      return result;
    },
    [workSchedule, checkIsRDO, holidays]
  );

  /**
   * Optimized version that gets various calendar state information for a day
   */
  const getDayState = useCallback(
    (day: Date, selectedDay: Date | null, monthStart: Date): DayStateResult => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const selectedDateKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : 'none';
      const monthStartKey = format(monthStart, 'yyyy-MM');
      const cacheKey = `state-${dateKey}-${selectedDateKey}-${monthStartKey}-${workSchedule?.id || 'none'}`;
      
      // Check cache
      const cachedState = dayStateCache.get(cacheKey);
      if (cachedState) {
        return cachedState;
      }
      
      const isRDO = checkIsRDO(day);
      const shiftInfo = isRDO ? getRDOShiftInfo(day) : { isShifted: false };
      
      // Create result and ensure fortnightWeek is always 1 or 2
      const fortnightWeekValue = getFortnightWeek(day);
      const result: DayStateResult = {
        isToday: isToday(day),
        isSelected: selectedDay ? day.toDateString() === selectedDay.toDateString() : false,
        isCurrentMonth: day.getMonth() === monthStart.getMonth(),
        isWeekend: isWeekend(day),
        isWorkingDay: checkIsWorkingDay(day),
        isRDO,
        isShiftedRDO: shiftInfo.isShifted,
        weekday: getWeekDay(day),
        fortnightWeek: fortnightWeekValue === 1 ? 1 : 2 as 1 | 2,
        originalRdoDate: shiftInfo.isShifted ? shiftInfo.originalDate : undefined,
        shiftReason: shiftInfo.reason || null
      };
      
      // Cache result
      dayStateCache.set(cacheKey, result);
      return result;
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
      dayStateCache.clear();
      logger.debug('Cleared helper caches due to schedule change');
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

// Export function to clear caches
export const clearCalendarHelperCaches = () => {
  startEndTimeCache.clear();
  dayStateCache.clear();
  lastCacheClear = Date.now();
};
