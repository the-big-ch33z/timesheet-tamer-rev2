
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { TimesheetContextType } from './types';
import { useTimesheet } from '@/hooks/useTimesheet';
import { useTimesheetEntries } from '@/hooks/timesheet/useTimesheetEntries';
import { v4 as uuidv4 } from 'uuid';
import { TimeEntry } from '@/types';

// Create context with default values
const TimesheetContext = createContext<TimesheetContextType | undefined>(undefined);

// Custom hook to use the timesheet context
export const useTimesheetContext = (): TimesheetContextType => {
  const context = useContext(TimesheetContext);
  if (!context) {
    throw new Error('useTimesheetContext must be used within a TimesheetProvider');
  }
  return context;
};

// Provider component
export const TimesheetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use existing hooks to gather all the data and functionality
  const {
    currentMonth,
    selectedDay,
    activeTab,
    targetUserId,
    isViewingOtherUser,
    viewedUser,
    canViewTimesheet,
    userWorkSchedule,
    setActiveTab,
    prevMonth,
    nextMonth,
    handleDayClick,
    setSelectedDay
  } = useTimesheet();
  
  const {
    entries,
    getUserEntries,
    getDayEntries,
    addEntry
  } = useTimesheetEntries(targetUserId);

  // Allow creating entries
  const createEntry = (entryData: Omit<TimeEntry, "id">) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: uuidv4(),
      userId: targetUserId || '',
    };
    
    addEntry(newEntry);
  };

  // This is now read-only for all users
  const canEditTimesheet = true;

  // Combine all values into a single context object
  const contextValue: TimesheetContextType = {
    targetUserId,
    viewedUser,
    isViewingOtherUser,
    canViewTimesheet,
    canEditTimesheet,
    currentMonth,
    selectedDay,
    workSchedule: userWorkSchedule,
    entries,
    activeTab,
    setActiveTab,
    prevMonth,
    nextMonth,
    handleDayClick,
    setSelectedDay,
    getUserEntries,
    getDayEntries,
    createEntry
  };

  return (
    <TimesheetContext.Provider value={contextValue}>
      {children}
    </TimesheetContext.Provider>
  );
};
