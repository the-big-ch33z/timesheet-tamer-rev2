
import React, { createContext, useContext, useState, useCallback } from 'react';
import { addMonths, subMonths } from 'date-fns';
import { CalendarContextType } from '../types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('CalendarContext');

// Create context with default values
const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export interface CalendarProviderProps {
  children: React.ReactNode;
  initialMonth?: Date;
  initialDay?: Date | null;
  onBeforeDateChange?: () => void;
}

/**
 * CalendarProvider
 * 
 * Provides calendar state and navigation functions
 * 
 * @dependency None - This is a root-level context that doesn't depend on other contexts
 * 
 * Dependencies Flow:
 * - This context is used by TimeEntryContext to show entries for the selected day
 * - This context may trigger the onBeforeDateChange callback from TimesheetContext
 */
export const CalendarProvider: React.FC<CalendarProviderProps> = ({
  children,
  initialMonth = new Date(),
  initialDay = null,
  onBeforeDateChange
}) => {
  // State for current month and selected day
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<Date | null>(initialDay);

  /**
   * Navigate to the previous month
   */
  const prevMonth = useCallback(() => {
    logger.debug('Navigating to previous month');
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  }, []);

  /**
   * Navigate to the next month
   */
  const nextMonth = useCallback(() => {
    logger.debug('Navigating to next month');
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  }, []);

  /**
   * Handle a day being clicked in the calendar
   * 
   * @param day - The day that was clicked
   */
  const handleDayClick = useCallback((day: Date) => {
    logger.debug(`Day clicked: ${day.toISOString()}`);
    
    if (onBeforeDateChange) {
      onBeforeDateChange();
    }
    
    setSelectedDay(day);
  }, [onBeforeDateChange]);

  // Context value
  const contextValue: CalendarContextType = {
    currentMonth,
    selectedDay,
    prevMonth,
    nextMonth,
    handleDayClick,
    setSelectedDay
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

/**
 * useCalendarContext
 * 
 * Hook to access calendar state and navigation functions
 * 
 * @returns {CalendarContextType} Calendar context value
 * @throws {Error} If used outside of a CalendarProvider
 */
export const useCalendarContext = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};
