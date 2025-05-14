
import React, { createContext, useContext, useState, useCallback } from 'react';
import { addMonths, subMonths } from 'date-fns';

interface CalendarContextType {
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

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ 
  children, 
  onBeforeDateChange 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const prevMonth = useCallback(() => {
    setCurrentMonth(subMonths(currentMonth, 1));
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1));
  }, [currentMonth]);

  const handleDayClick = useCallback((day: Date) => {
    if (onBeforeDateChange) {
      onBeforeDateChange();
    }
    setSelectedDay(day);
  }, [onBeforeDateChange]);

  return (
    <CalendarContext.Provider
      value={{
        currentMonth,
        selectedDay,
        prevMonth,
        nextMonth,
        handleDayClick,
        setSelectedDay,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
