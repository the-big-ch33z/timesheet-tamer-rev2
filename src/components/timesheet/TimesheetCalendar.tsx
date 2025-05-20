
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
import { eventBus } from "@/utils/events/EventBus";
import { TOIL_EVENTS } from "@/utils/events/eventTypes";

const logger = createTimeLogger('TimesheetCalendar');

interface TimesheetCalendarProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
  workSchedule?: WorkSchedule;
  userId: string;
}

// Use React.memo to prevent unnecessary re-renders
const TimesheetCalendar: React.FC<TimesheetCalendarProps> = memo(({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  workSchedule,
  userId
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Track when TOIL data is refreshed
  const [lastToilUpdate, setLastToilUpdate] = useState<Date | null>(null);
  
  // Listen for TOIL updates to track them
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(TOIL_EVENTS.CALENDAR_REFRESH, (data) => {
      if (data && data.userId === userId) {
        logger.debug(`[TimesheetCalendar] Tracking TOIL calendar refresh: ${new Date().toISOString()}`);
        setLastToilUpdate(new Date());
      }
    });
    
    return () => unsubscribe();
  }, [userId]);
  
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
    
    // Publish an event that we're changing months
    eventBus.publish('calendar:month-changed', {
      direction: 'prev',
      newMonth: onPrevMonth,
      userId
    });
  }, [onPrevMonth, toast, userId]);
  
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
    
    // Publish an event that we're changing months
    eventBus.publish('calendar:month-changed', {
      direction: 'next',
      newMonth: onNextMonth,
      userId
    });
  }, [onNextMonth, toast, userId]);

  const handleDayClick = useCallback((day: Date) => {
    logger.debug("[TimesheetCalendar] Day clicked:", format(day, "yyyy-MM-dd"));
    if (selectedDate?.getTime() !== day.getTime()) {
      logger.debug("[TimesheetCalendar] Date changing, triggering global save");
      triggerGlobalSave();
    }
    
    setSelectedDate(day);
    onDayClick(day);
    
    // Publish a day selection event with minimal debounce
    eventBus.publish('calendar:day-selected', {
      day: day.toISOString(),
      userId,
      timestamp: Date.now()
    }, { debounce: 50 });
  }, [selectedDate, onDayClick, userId]);

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
}, (prevProps, nextProps) => {
  // Custom equality check for the memo
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.currentMonth.getTime() === nextProps.currentMonth.getTime() &&
    prevProps.onPrevMonth === nextProps.onPrevMonth &&
    prevProps.onNextMonth === nextProps.onNextMonth &&
    prevProps.onDayClick === nextProps.onDayClick &&
    prevProps.workSchedule?.id === nextProps.workSchedule?.id
  );
});

TimesheetCalendar.displayName = 'TimesheetCalendar';

export default TimesheetCalendar;
