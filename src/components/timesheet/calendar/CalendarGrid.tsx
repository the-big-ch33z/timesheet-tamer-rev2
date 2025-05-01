
import React, { useMemo, memo } from "react";
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
import { hasTOILForDay } from "@/utils/time/services/toil/storage";

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  workSchedule?: WorkSchedule;
  onDayClick: (day: Date) => void;
  userId: string;
}

// Add debug mode feature toggle
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
  }, [currentMonth, logger, DEBUG_CALENDAR]);

  // Memoize RDO shift calculation
  const shiftedRDOMap = useMemo(() => {
    return getShiftedRDOsForMonth(days, workSchedule, holidays);
  }, [days, workSchedule, holidays]);

  // Memoize heavy day data calculations
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
        const shiftedInfo = shiftedRDOMap.get(dateKey)!;
        isRDO = true;
        isShiftedRDO = true;
        originalRdoDate = shiftedInfo.originalDate;
        shiftReason = shiftedInfo.reason;
      }

      // NEW: Check for TOIL records for this day
      const toilInfo = hasTOILForDay(userId, day);

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
        isToilDay: hasToilEntry || toilInfo.hasUsed, // FIX: Check both for entries and TOIL usage records
        hasTOILAccrued: toilInfo.hasAccrued,
        hasTOILUsed: toilInfo.hasUsed,
        toilHours: toilInfo.toilHours
      });
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
    DEBUG_CALENDAR,
    logger,
    userId // Added userId to dependencies
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
