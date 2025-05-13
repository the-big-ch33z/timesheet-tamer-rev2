
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { addMonths, subMonths, startOfMonth, isEqual, format } from 'date-fns';

// Define the state interface
export interface CalendarState {
  currentMonth: Date;
  selectedDay: Date;
}

// Define the context type including state and setters
export interface CalendarContextType extends CalendarState {
  prevMonth: () => void;
  nextMonth: () => void;
  setSelectedDay: (date: Date) => void;
  handleDayClick: (day: Date) => void;
}

// Create the context with default values
const CalendarContext = createContext<CalendarContextType>({
  currentMonth: new Date(),
  selectedDay: new Date(),
  prevMonth: () => {},
  nextMonth: () => {},
  setSelectedDay: () => {},
  handleDayClick: () => {}
});

// Hook for accessing calendar context
export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    console.error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};

// Type for the CalendarProvider props
export interface CalendarProviderProps {
  initialDate?: Date;
  children: React.ReactNode;
  onBeforeDateChange?: () => void;
}

// Provider component
export const CalendarProvider: React.FC<CalendarProviderProps> = ({
  initialDate = new Date(),
  children,
  onBeforeDateChange
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(initialDate));
  const [selectedDay, setSelectedDayState] = useState<Date>(initialDate);
  
  console.log('CalendarContext - Initializing with:', { 
    currentMonth: format(currentMonth, 'yyyy-MM-dd'),
    selectedDay: format(selectedDay, 'yyyy-MM-dd')
  });

  // Navigate to previous month
  const prevMonth = useCallback(() => {
    console.log('CalendarContext - Navigating to previous month');
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  // Navigate to next month
  const nextMonth = useCallback(() => {
    console.log('CalendarContext - Navigating to next month');
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  // Set selected day with possible callback before changing
  const setSelectedDay = useCallback((date: Date) => {
    console.log('CalendarContext - Setting selected day:', format(date, 'yyyy-MM-dd'));
    
    if (onBeforeDateChange && !isEqual(date, selectedDay)) {
      console.log('CalendarContext - Triggering onBeforeDateChange callback');
      onBeforeDateChange();
    }
    
    setSelectedDayState(date);
    
    // If the new day is in a different month, update the current month
    if (format(date, 'yyyy-MM') !== format(currentMonth, 'yyyy-MM')) {
      console.log('CalendarContext - Updating current month to match selected day');
      setCurrentMonth(startOfMonth(date));
    }
  }, [onBeforeDateChange, selectedDay, currentMonth]);

  // Handle day click (same as setSelectedDay for now)
  const handleDayClick = useCallback((day: Date) => {
    console.log('CalendarContext - Day clicked:', format(day, 'yyyy-MM-dd'));
    setSelectedDay(day);
  }, [setSelectedDay]);

  // Log changes to key state variables
  useEffect(() => {
    console.log('CalendarContext - Current month updated:', format(currentMonth, 'yyyy-MM'));
  }, [currentMonth]);
  
  useEffect(() => {
    console.log('CalendarContext - Selected day updated:', format(selectedDay, 'yyyy-MM-dd'));
  }, [selectedDay]);

  const contextValue: CalendarContextType = {
    currentMonth,
    selectedDay,
    prevMonth,
    nextMonth,
    setSelectedDay,
    handleDayClick
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

export default CalendarContext;
