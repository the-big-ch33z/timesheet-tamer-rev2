
import React, { useCallback, useEffect, useState } from "react";
import { format, isSameMonth, isSameDay, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkSchedule } from "@/types";
import { getWeekDay, getFortnightWeek } from "@/utils/time/scheduleUtils";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  onDayClick: (day: Date) => void;
  workSchedule?: WorkSchedule;
  userId: string;
}

// Utility to check if a day is a scheduled work day
const isScheduledWorkDay = (date: Date, workSchedule?: WorkSchedule): boolean => {
  if (!workSchedule) return false;

  const weekDay = getWeekDay(date);
  const fortnightWeek = getFortnightWeek(date);
  const dayConfig = workSchedule.weeks[fortnightWeek]?.[weekDay];

  return !!dayConfig && dayConfig.startTime !== null && dayConfig.endTime !== null;
};

// Utility to check if a day contains a synthetic leave entry
function getSyntheticLeaveType(dayEntries: any) {
  // Find a synthetic leave/sick/toil entry (entryType: "auto", and description matches)
  if (!Array.isArray(dayEntries)) return null;
  for (const entry of dayEntries) {
    if (entry.entryType === "auto" && typeof entry.description === "string") {
      if (entry.description.startsWith("Annual Leave")) return "annual";
      if (entry.description.startsWith("Sick Leave")) return "sick";
      if (entry.description.startsWith("TOIL")) return "toil";
    }
  }
  return null;
}

const dayBgColors = {
  annual: "#D3E4FD", // Soft Blue for Annual Leave
  sick: "#ffd5d9",   // Soft Red for Sick Leave
  toil: "#e8e3fc"    // Soft Purple for TOIL
};

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  selectedDate,
  onDayClick,
  workSchedule,
  userId
}) => {
  const { getDayEntries } = useTimeEntryContext();
  const [days, setDays] = useState<Date[]>([]);

  useEffect(() => {
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const newDays: Date[] = [];
    let currentDay = firstDayOfMonth;

    while (currentDay <= lastDayOfMonth) {
      newDays.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    setDays(newDays);
  }, [currentMonth]);

  const handleDayClick = useCallback((day: Date) => {
    onDayClick(day);
  }, [onDayClick]);

  return (
    <div className="grid grid-cols-7 gap-0.5 mt-2">
      {days.map((day) => {
        const dayEntries = getDayEntries(day, userId);
        const leaveType = getSyntheticLeaveType(dayEntries);
        const dayBg = leaveType ? dayBgColors[leaveType] : "transparent";
        const isScheduled = isScheduledWorkDay(day, workSchedule);

        return (
          <Button
            key={day.toISOString()}
            className={cn(
              "flex flex-col items-center justify-center w-full h-12 p-0 rounded-none border-0 shadow-none",
              isSameDay(day, selectedDate) && "bg-blue-500 text-white hover:bg-blue-500",
              !isSameMonth(day, currentMonth) && "text-gray-400 hover:bg-transparent",
              isToday(day) && "font-semibold",
              isScheduled && "font-medium",
              "hover:bg-gray-100 focus-visible:bg-gray-100 active:bg-gray-100",
            )}
            style={{
              backgroundColor: dayBg,
            }}
            onClick={() => handleDayClick(day)}
            disabled={!isSameMonth(day, currentMonth)}
          >
            <time dateTime={format(day, "yyyy-MM-dd")}>
              {format(day, "d")}
            </time>
          </Button>
        );
      })}
    </div>
  );
};

export default CalendarGrid;
