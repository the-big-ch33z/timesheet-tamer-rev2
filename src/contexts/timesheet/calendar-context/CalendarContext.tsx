
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useCalendarState } from '@/hooks/timesheet/useCalendarState';
import { CalendarContextType } from '../types';
import { triggerGlobalSave } from '../TimesheetContext';

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendarContext = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: ReactNode;
  onBeforeDateChange?: () => void; // Callback for before date changes
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ 
  children, 
  onBeforeDateChange 
}) => {
  const {
    currentMonth,
    selectedDay,
    prevMonth,
    nextMonth,
    setSelectedDay
  } = useCalendarState();
  
  // Create a wrapped version of handleDayClick that calls onBeforeDateChange first
  // and explicitly triggers the global save event
  const handleDayClick = (day: Date) => {
    // If we have a callback and we're changing the date
    if (selectedDay && day && selectedDay.getTime() !== day.getTime()) {
      console.debug("[CalendarContext] Date changing, triggering save event");
      // Explicitly trigger the global save
      triggerGlobalSave();
      
      // Then call the callback if provided
      if (onBeforeDateChange) {
        onBeforeDateChange();
      }
    }
    
    // Then update the selected day
    setSelectedDay(day);
  };
  
  // Watch for direct setSelectedDay calls
  useEffect(() => {
    // This effect runs when selectedDay changes
    console.debug("[CalendarContext] Selected day changed:", selectedDay);
  }, [selectedDay]);

  const value: CalendarContextType = {
    currentMonth,
    selectedDay,
    prevMonth,
    nextMonth,
    handleDayClick,
    setSelectedDay
  };
  
  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
