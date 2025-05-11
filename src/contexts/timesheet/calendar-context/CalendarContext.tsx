
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useCalendarState } from '@/hooks/timesheet/useCalendarState';
import { CalendarContextType } from '../types';
import { triggerGlobalSave } from '../TimesheetContext';

/**
 * CalendarContext
 * 
 * Manages calendar state for the timesheet application
 * Responsible for:
 * - Current month navigation
 * - Selected day management
 * - Date change event handling
 * 
 * This context is independent and doesn't rely on other contexts,
 * making it reusable across different parts of the application.
 */
const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

/**
 * useCalendarContext
 * Primary hook for accessing calendar functionality
 */
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

/**
 * CalendarProvider
 * Provides calendar state and operations to its children
 */
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
