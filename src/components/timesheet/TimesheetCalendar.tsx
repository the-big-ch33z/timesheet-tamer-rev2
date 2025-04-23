
import React, { useState, useCallback, useEffect, memo } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { WorkSchedule } from "@/types";
import CalendarHeader from "./calendar/CalendarHeader";
import CalendarLegend from "./calendar/CalendarLegend";
import CalendarWeekdayHeader from "./calendar/CalendarWeekdayHeader";
import CalendarGrid from "./calendar/CalendarGrid";
import { triggerGlobalSave } from "@/contexts/timesheet/TimesheetContext";
import { useToast } from "@/hooks/use-toast";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TimesheetCalendar');

interface TimesheetCalendarProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
  workSchedule?: WorkSchedule;
  userId: string;
}

const TimesheetCalendar: React.FC<TimesheetCalendarProps> = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  workSchedule,
  userId
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Log when workSchedule changes
  useEffect(() => {
    if (workSchedule) {
      logger.debug(`[TimesheetCalendar] Using work schedule: ${workSchedule.name || 'unnamed'} (id: ${workSchedule.id})`);
    } else {
      logger.debug(`[TimesheetCalendar] No work schedule available`);
    }
  }, [workSchedule]);
  
  const handlePrevMonth = useCallback(() => {
    logger.debug("[TimesheetCalendar] Moving to previous month, saving pending changes");
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
    logger.debug("[TimesheetCalendar] Moving to next month, saving pending changes");
    const saved = triggerGlobalSave();
    onNextMonth();
    
    if (saved) {
      toast({
        title: "Changes saved",
        description: "Your timesheet changes were saved before navigation",
      });
    }
  }, [onNextMonth, toast]);

  const handleDayClick = useCallback((day: Date) => {
    logger.debug("[TimesheetCalendar] Day clicked:", format(day, "yyyy-MM-dd"));
    if (selectedDate?.getTime() !== day.getTime()) {
      logger.debug("[TimesheetCalendar] Date changing, triggering global save");
      triggerGlobalSave();
    }
    
    setSelectedDate(day);
    onDayClick(day);
  }, [selectedDate, onDayClick]);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <CalendarHeader 
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
        
        <CalendarLegend hasWorkSchedule={!!workSchedule} />

        <CalendarWeekdayHeader />

        <CalendarGrid 
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          workSchedule={workSchedule}
          onDayClick={handleDayClick}
          userId={userId}
        />
      </CardContent>
    </Card>
  );
};

export default memo(TimesheetCalendar);
