
import React, { createContext, useContext, useState, useCallback } from 'react';
import { startOfMonth, addMonths, subMonths } from 'date-fns';

interface CalendarState {
  currentMonth: Date;
  selectedDay: Date;
}

interface CalendarContextType extends CalendarState {
  nextMonth: () => void;
  prevMonth: () => void;
  handleDayClick: (day: Date) => void;
  setSelectedDay: (day: Date) => void;
}

interface CalendarProviderProps {
  children: React.ReactNode;
  onBeforeDateChange?: () => void;
}

const CalendarContext = createContext<CalendarContextType>({
  currentMonth: new Date(),
  selectedDay: new Date(),
  nextMonth: () => {},
  prevMonth: () => {},
  handleDayClick: () => {},
  setSelectedDay: () => {},
});

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ 
  children,
  onBeforeDateChange 
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState(today);

  const nextMonth = useCallback(() => {
    setCurrentMonth(current => addMonths(current, 1));
  }, []);

  const prevMonth = useCallback(() => {
    setCurrentMonth(current => subMonths(current, 1));
  }, []);

  const handleDayClick = useCallback((day: Date) => {
    if (onBeforeDateChange) {
      onBeforeDateChange();
    }
    setSelectedDay(day);
  }, [onBeforeDateChange]);

  const value = {
    currentMonth,
    selectedDay,
    nextMonth,
    prevMonth,
    handleDayClick,
    setSelectedDay,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

export default CalendarContext;
