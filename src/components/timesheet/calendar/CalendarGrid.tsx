
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

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  workSchedule?: WorkSchedule;
  onDayClick: (day: Date) => void;
  userId: string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  selectedDate,
  workSchedule,
  onDayClick,
  userId
}) => {
  const logger = useLogger("CalendarGrid");
  const { getDayEntries } = useTimeEntryContext();
  const { getDayState, getStartAndEndTimeForDay } = useCalendarHelpers(workSchedule);
  const holidays = useMemo(() => getHolidays(), []);

  const days = useMemo(() => {
    logger.debug("Calculating calendar grid days");
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth, logger]);

  const shiftedRDOMap = useMemo(() => {
    return getShiftedRDOsForMonth(days, workSchedule, holidays);
  }, [days, workSchedule, holidays]);

  const daysData = useMemo(() => {
    logger.debug("Pre-calculating calendar days data");
    const monthStart = startOfMonth(currentMonth);

    return days.map(day => {
      const isCurrentMonth = isSameMonth(day, monthStart);

      if (!isCurrentMonth) {
        return {
          day,
          isCurrentMonth: false,
        };
      }

      const dayState = getDayState(day, selectedDate, monthStart);
      const { startTime, endTime } = getStartAndEndTimeForDay(day);
      const entries = getDayEntries(day);
      const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

      const hasLeaveEntry = entries.some(entry => entry.jobNumber === "LEAVE");
      const hasSickEntry = entries.some(entry => entry.jobNumber === "SICK");
      const hasToilEntry = entries.some(entry => entry.jobNumber === "TOIL-USED");

      const { isComplete } = calculateCompletion(entries, startTime, endTime, 0.01);

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

      return {
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
        isToilDay: hasToilEntry
      };
    });
  }, [
    days,
    selectedDate,
    getDayEntries,
    getDayState,
    getStartAndEndTimeForDay,
    currentMonth,
    shiftedRDOMap
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
};

const MemoizedCalendarDay = memo(CalendarDay);

export default memo(CalendarGrid);
