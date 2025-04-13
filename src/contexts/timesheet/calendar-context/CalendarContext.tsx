
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useCalendarState } from '@/hooks/timesheet/useCalendarState';
import { CalendarContextType } from '../types';

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
  onBeforeDateChange?: () => void; // New callback for before date changes
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
  const handleDayClick = (day: Date) => {
    // If we have a callback and we're changing the date
    if (onBeforeDateChange && 
       (!selectedDay || selectedDay.getTime() !== day.getTime())) {
      onBeforeDateChange();
    }
    
    // Then update the selected day
    setSelectedDay(day);
  };
  
  // Watch for direct setSelectedDay calls from outside this component
  useEffect(() => {
    // We don't do anything here, this is just to expose the current 
    // selectedDay value to consumers of the context
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
