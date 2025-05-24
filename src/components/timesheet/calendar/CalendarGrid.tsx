
import React, { useMemo, memo, useState, useEffect, useCallback } from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  isToday as dateFnsIsToday 
} from "date-fns";
import CalendarDay from "./CalendarDay";
import { TimeEntry, WorkSchedule } from "@/types";
import { useCalendarHelpers } from "./useCalendarHelpers";
import { isHoliday } from "@/utils/time/services/toil/holiday-utils";
import { defaultQueenslandHolidays, getHolidays } from "@/lib/holidays";
import { useLogger } from "@/hooks/useLogger";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { calculateCompletion } from "@/utils/timesheet/completionUtils";
import { getShiftedRDOsForMonth } from "@/utils/time/rdoDisplay";
import { hasTOILForDay, TOILDayInfo } from "@/utils/time/services/toil/storage";
import { eventBus } from "@/utils/events/EventBus";
import { TOIL_EVENTS, TOILEventData } from "@/utils/events/eventTypes";

// Remove the duplicate TOILEventData interface

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  workSchedule?: WorkSchedule;
  onDayClick: (day: Date) => void;
  userId: string;
}

// Set debug mode to false to reduce console spam
const DEBUG_CALENDAR = false;

const CalendarGrid: React.FC<CalendarGridProps> = memo(({
  currentMonth,
  selectedDate,
  workSchedule,
  onDayClick,
  userId
}) => {
  const logger = useLogger("CalendarGrid");
  const { getDayEntries } = useTimeEntryContext();
  const { getDayState, getStartAndEndTimeForDay } = useCalendarHelpers(workSchedule);
  
  // Add state for refreshing when TOIL events come in
  const [toilRefreshCounter, setToilRefreshCounter] = useState(0);
  
  // Add a callback function to handle TOIL events consistently
  const handleTOILUpdate = useCallback((data: TOILEventData) => {
    if (!data) return;
    
    const shouldRefresh = 
      // Default case: matches user ID
      (data.userId === userId) ||
      // Special cases for different event formats
      (data.detail?.userId === userId) ||
      // Consider refresh flags in events
      (data.requiresRefresh === true);
    
    if (shouldRefresh) {
      if (DEBUG_CALENDAR) {
        logger.debug(`[CalendarGrid] Received TOIL event, refreshing (Source: ${data.source || 'unknown'})`);
      }
      setToilRefreshCounter(prev => prev + 1);
    }
  }, [userId, logger]);
  
  // Listen for TOIL events that should trigger a calendar refresh
  useEffect(() => {
    // Create a debug logger especially for events
    const eventLogger = (name: string) => (data: TOILEventData) => {
      if (DEBUG_CALENDAR) {
        logger.debug(`[CalendarGrid:Events] Received ${name} event:`, 
          data?.userId === userId ? 'matches-user' : 'other-user');
      }
    };
    
    // Array of event subscriptions to manage together
    const subscriptions = [
      // Primary calculation events
      eventBus.subscribe(TOIL_EVENTS.CALCULATED, (data: TOILEventData) => {
        eventLogger('CALCULATED')(data);
        handleTOILUpdate(data);
      }),
      
      // Summary update events
      eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: TOILEventData) => {
        eventLogger('SUMMARY_UPDATED')(data);
        handleTOILUpdate(data);
      }),
      
      // General update events
      eventBus.subscribe(TOIL_EVENTS.UPDATED, (data: TOILEventData) => {
        eventLogger('UPDATED')(data);
        handleTOILUpdate(data);
      }),
      
      // Direct calendar refresh events (highest priority)
      eventBus.subscribe(TOIL_EVENTS.CALENDAR_REFRESH, (data: TOILEventData) => {
        eventLogger('CALENDAR_REFRESH')(data);
        // Always refresh for this direct event type
        if (DEBUG_CALENDAR) {
          logger.debug(`[CalendarGrid] Received direct calendar refresh event from ${data?.source || 'unknown'}`);
        }
        setToilRefreshCounter(prev => prev + 1);
      })
    ];
    
    // Also listen for DOM events for backward compatibility
    const domEventHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      handleTOILUpdate(customEvent.detail || {});
    };
    
    window.addEventListener('toil:calculated', domEventHandler);
    window.addEventListener('toil:summary-updated', domEventHandler);
    window.addEventListener('toil:updated', domEventHandler);
    
    // Cleanup all subscriptions
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
      window.removeEventListener('toil:calculated', domEventHandler);
      window.removeEventListener('toil:summary-updated', domEventHandler);
      window.removeEventListener('toil:updated', domEventHandler);
    };
  }, [userId, logger, handleTOILUpdate]);
  
  // Memoize holidays to prevent recalculation
  const holidays = useMemo(() => getHolidays(), []);

  // Memoize days calculation
  const days = useMemo(() => {
    if (DEBUG_CALENDAR) logger.debug("Calculating calendar grid days");
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth, logger]);

  // Memoize RDO shift calculation
  const shiftedRDOMap = useMemo(() => {
    if (DEBUG_CALENDAR) {
      logger.debug("Calculating shifted RDOs");
    }
    return getShiftedRDOsForMonth(days, workSchedule, holidays);
  }, [days, workSchedule, holidays, logger]);

  // Memoize heavy day data calculations - now includes toilRefreshCounter as dependency
  const daysData = useMemo(() => {
    if (DEBUG_CALENDAR) logger.debug("Pre-calculating calendar days data");
    const monthStart = startOfMonth(currentMonth);
    const calculatedData = [];
    
    // Use a simple for loop instead of map for better performance
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const isCurrentMonth = isSameMonth(day, monthStart);

      if (!isCurrentMonth) {
        calculatedData.push({
          day,
          isCurrentMonth: false,
        });
        continue;
      }

      const dayState = getDayState(day, selectedDate, monthStart);
      const { startTime, endTime } = getStartAndEndTimeForDay(day);
      const entries = getDayEntries(day);
      const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

      // Check for special entry types
      const hasLeaveEntry = entries.some(entry => entry.jobNumber === "LEAVE");
      const hasSickEntry = entries.some(entry => entry.jobNumber === "SICK");
      
      // FIX: Check for TOIL entries using the correct job number
      const hasToilEntry = entries.some(entry => entry.jobNumber === "TOIL");

      // Calculate completion status for each day
      const completion = calculateCompletion(entries, startTime, endTime, 0.01);
      // Fix: Set isComplete properly based on the completion calculation
      const isComplete = entries.length > 0 && completion.isComplete;

      const dateKey = day.toISOString().split('T')[0];
      const isShiftedRDOTarget = shiftedRDOMap.has(dateKey);
      let isRDO = dayState.isRDO;
      let isShiftedRDO = false;
      let originalRdoDate = undefined;
      let shiftReason = null;
      
      if (isShiftedRDOTarget) {
        const shiftInfo = shiftedRDOMap.get(dateKey)!;
        isRDO = true;
        isShiftedRDO = true;
        originalRdoDate = shiftInfo.originalDate;
        shiftReason = shiftInfo.reason;
      }

      // REMOVED: Excessive console logging that was causing performance issues
      // Only log TOIL checking in debug mode
      if (DEBUG_CALENDAR) {
        logger.debug(`Checking TOIL for day: ${format(day, 'yyyy-MM-dd')}`);
      }
      
      // Initialize with default values that match TOILDayInfo interface
      let toilInfo: TOILDayInfo = {
        hasToil: false,
        hasAccrued: false,
        hasUsed: false,
        toilHours: 0
      };

      try {
        // Use the hasTOILForDay function if available
        if (typeof hasTOILForDay === 'function') {
          toilInfo = hasTOILForDay(userId, day);
          if (DEBUG_CALENDAR) {
            logger.debug(`TOIL for ${format(day, 'yyyy-MM-dd')}: accrued=${toilInfo.hasAccrued}, used=${toilInfo.hasUsed}, hours=${toilInfo.toilHours}`);
          }
        } else if (DEBUG_CALENDAR) {
          logger.debug(`hasTOILForDay function not available, using default values`);
        }
      } catch (error) {
        logger.error(`Error checking TOIL for day ${format(day, 'yyyy-MM-dd')}:`, error);
      }

      calculatedData.push({
        day,
        isCurrentMonth: true,
        entries,
        isSelected: selectedDate ? isSameDay(day, selectedDate) : false,
        isToday: dateFnsIsToday(day),
        isComplete,
        totalHours,
        isWeekend: dayState.isWeekend,
        isWorkDay: dayState.isWorkingDay,
        expectedStartTime: startTime,
        expectedEndTime: endTime,
        isRDO,
        isShiftedRDO,
        originalRdoDate,
        shiftReason,
        isLeaveDay: hasLeaveEntry,
        isSickDay: hasSickEntry,
        isToilDay: hasToilEntry || toilInfo.hasUsed,
        hasTOILAccrued: toilInfo.hasAccrued,
        hasTOILUsed: toilInfo.hasUsed,
        toilHours: toilInfo.toilHours
      });
    }
    
    if (DEBUG_CALENDAR) {
      logger.debug(`Completed calculation for ${calculatedData.length} days`);
    }
    return calculatedData;
  }, [
    days,
    selectedDate,
    getDayEntries,
    getDayState,
    getStartAndEndTimeForDay,
    currentMonth,
    shiftedRDOMap,
    logger,
    userId,
    toilRefreshCounter // This dependency ensures recalculation when TOIL updates occur
  ]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {daysData.map((dayData, i) => {
        const { day, isCurrentMonth } = dayData;

        if (!isCurrentMonth) {
          return (
            <div
              key={`empty-${i}`}
              className="w-full min-h-[80px] p-2 bg-gray-50 text-gray-300 rounded border border-gray-100"
            >
              <span className="text-sm">{format(day, "d")}</span>
            </div>
          );
        }

        return (
          <MemoizedCalendarDay
            key={day.toString()}
            {...dayData}
            onClick={onDayClick}
          />
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom equality function for CalendarGrid memo
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.currentMonth.getTime() === nextProps.currentMonth.getTime() &&
    prevProps.workSchedule?.id === nextProps.workSchedule?.id &&
    ((prevProps.selectedDate === null && nextProps.selectedDate === null) ||
      (prevProps.selectedDate?.getTime() === nextProps.selectedDate?.getTime()))
  );
});

const MemoizedCalendarDay = memo(CalendarDay);

CalendarGrid.displayName = 'CalendarGrid';

export default CalendarGrid;
