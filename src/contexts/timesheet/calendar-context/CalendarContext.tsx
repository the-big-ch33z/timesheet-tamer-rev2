
import React, { createContext, useContext, ReactNode } from 'react';
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
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const {
    currentMonth,
    selectedDay,
    prevMonth,
    nextMonth,
    handleDayClick,
    setSelectedDay
  } = useCalendarState();
  
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
