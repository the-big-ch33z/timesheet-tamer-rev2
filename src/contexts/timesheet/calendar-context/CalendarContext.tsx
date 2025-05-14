
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('CalendarContext');

export interface CalendarContextType {
  currentMonth: Date;
  selectedDay: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  handleDayClick: (day: Date) => void;
  setSelectedDay: (day: Date) => void;
}

interface CalendarProviderProps {
  children: React.ReactNode;
  onBeforeDateChange?: () => void;
}

const CalendarContext = createContext<CalendarContextType | null>(null);

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ 
  children, 
  onBeforeDateChange 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  // Navigate to previous month
  const prevMonth = useCallback(() => {
    setCurrentMonth(prevDate => {
      const date = new Date(prevDate);
      date.setMonth(date.getMonth() - 1);
      return date;
    });
  }, []);
  
  // Navigate to next month
  const nextMonth = useCallback(() => {
    setCurrentMonth(prevDate => {
      const date = new Date(prevDate);
      date.setMonth(date.getMonth() + 1);
      return date;
    });
  }, []);
  
  // Handle day selection with callback for saving pending changes
  const handleDayClick = useCallback((day: Date) => {
    logger.debug(`Day clicked: ${day.toLocaleDateString()}`);
    
    // Trigger the before date change callback if provided
    if (onBeforeDateChange) {
      onBeforeDateChange();
    }
    
    // Set the selected day after a short delay to allow saving
    setTimeout(() => {
      setSelectedDay(day);
    }, 10);
  }, [onBeforeDateChange]);
  
  // Log when the selected day changes
  useEffect(() => {
    logger.debug(`Selected day set to: ${selectedDay.toLocaleDateString()}`);
  }, [selectedDay]);
  
  return (
    <CalendarContext.Provider value={{
      currentMonth,
      selectedDay,
      prevMonth,
      nextMonth,
      handleDayClick,
      setSelectedDay
    }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};
