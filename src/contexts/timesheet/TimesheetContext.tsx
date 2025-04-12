
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { TimesheetContextType } from './types';
import { useTimesheet } from '@/hooks/useTimesheet';
import { useTimesheetEntries } from '@/hooks/timesheet/useTimesheetEntries';
import { useRolePermission } from '@/hooks/useRolePermission';

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
    getUserEntries,
    getDayEntries
  } = useTimesheetEntries(targetUserId);

  const { isAdmin, isManager } = useRolePermission();
  
  // This is now read-only for all users
  const canEditTimesheet = false;

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
    entries: getUserEntries(),
    activeTab,
    setActiveTab,
    prevMonth,
    nextMonth,
    handleDayClick,
    setSelectedDay,
    getUserEntries,
    getDayEntries,
    // Provide no-op functions to maintain interface compatibility
    addEntry: () => {},
    deleteEntry: () => {},
    updateEntry: () => {}
  };

  return (
    <TimesheetContext.Provider value={contextValue}>
      {children}
    </TimesheetContext.Provider>
  );
};
