
import React, { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { WorkSchedule } from "@/types";
import { Holiday, getHolidays } from "@/lib/holidays";
import CalendarHeader from "./calendar/CalendarHeader";
import CalendarLegend from "./calendar/CalendarLegend";
import CalendarWeekdayHeader from "./calendar/CalendarWeekdayHeader";
import CalendarGrid from "./calendar/CalendarGrid";
import { triggerGlobalSave } from "@/contexts/timesheet/TimesheetContext";
import { useToast } from "@/hooks/use-toast";

interface TimesheetCalendarProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
  workSchedule?: WorkSchedule;
}

const TimesheetCalendar: React.FC<TimesheetCalendarProps> = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  workSchedule,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Enhanced month navigation to trigger saving
  const handlePrevMonth = useCallback(() => {
    console.debug("[TimesheetCalendar] Moving to previous month, saving pending changes");
    const saved = triggerGlobalSave();
    onPrevMonth();
    
    if (saved) {
      toast({
        title: "Changes saved",
        description: "Your timesheet changes were saved before navigation",
      });
    }
  }, [onPrevMonth, toast]);
  
  const handleNextMonth = useCallback(() => {
    console.debug("[TimesheetCalendar] Moving to next month, saving pending changes");
    const saved = triggerGlobalSave();
    onNextMonth();
    
    if (saved) {
      toast({
        title: "Changes saved",
        description: "Your timesheet changes were saved before navigation",
      });
    }
  }, [onNextMonth, toast]);

  // Enhanced day click handler with explicit selected date state
  const handleDayClick = useCallback((day: Date) => {
    console.debug("[TimesheetCalendar] Day clicked:", format(day, "yyyy-MM-dd"));
    if (selectedDate?.getTime() !== day.getTime()) {
      console.debug("[TimesheetCalendar] Date changing, triggering global save");
      triggerGlobalSave();
    }
    
    setSelectedDate(day);
    onDayClick(day);
  }, [selectedDate, onDayClick]);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        {/* Calendar Header */}
        <CalendarHeader 
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
        
        {/* Calendar Legend */}
        <CalendarLegend hasWorkSchedule={!!workSchedule} />

        {/* Weekday Headers */}
        <CalendarWeekdayHeader />

        {/* Calendar Grid */}
        <CalendarGrid 
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          workSchedule={workSchedule}
          onDayClick={handleDayClick}
        />
      </CardContent>
    </Card>
  );
};

export default TimesheetCalendar;
