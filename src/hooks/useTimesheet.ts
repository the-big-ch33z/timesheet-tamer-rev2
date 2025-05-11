
import { useCalendarState } from "./timesheet/useCalendarState";
import { useTimesheetContext } from "./timesheet/useTimesheetContext";
import { useTimeEntriesWithRecovery } from "./timeEntries/useTimeEntriesWithRecovery";
import { useLogger } from "./useLogger";
import { useErrorHandler } from "./useErrorHandler";

/**
 * Primary hook for timesheet functionality
 * Enhanced with better error handling and service recovery
 * 
 * This is the main hook for accessing timesheet functionality and provides
 * a unified API for all timesheet-related data and actions.
 */
export const useTimesheet = () => {
  const logger = useLogger("Timesheet");
  const { errorState, handleError } = useErrorHandler("Timesheet");
  
  // Use our specialized hooks
  const {
    currentMonth,
    selectedDay,
    prevMonth,
    nextMonth,
    handleDayClick,
    setSelectedDay
  } = useCalendarState();
  
  const {
    activeTab,
    targetUserId,
    isViewingOtherUser,
    viewedUser,
    canViewTimesheet,
    userWorkSchedule,
    setActiveTab
  } = useTimesheetContext();
  
  // Get entries for the current user with recovery logic
  const {
    entries,
    isLoading: entriesLoading,
    error: entriesError,
    isServiceReady
  } = useTimeEntriesWithRecovery({
    userId: targetUserId || undefined,
    date: selectedDay,
    showToasts: false
  });
  
  // Handle any errors from entries loading
  if (entriesError && !errorState.hasError) {
    handleError(new Error(entriesError), 'loading entries');
  }
  
  logger.debug("Timesheet hook initialized", { 
    targetUserId, 
    hasViewedUser: !!viewedUser,
    canViewTimesheet,
    entriesCount: entries?.length,
    isServiceReady
  });

  // Return merged state and handlers from specialized hooks
  return {
    // Calendar state
    currentMonth,
    selectedDay,
    prevMonth,
    nextMonth,
    handleDayClick,
    setSelectedDay,
    
    // Entries
    entries,
    entriesLoading,
    entriesError,
    isServiceReady,
    
    // Timesheet context
    activeTab,
    targetUserId,
    isViewingOtherUser,
    viewedUser,
    canViewTimesheet,
    userWorkSchedule,
    setActiveTab,
    
    // Error state
    error: errorState.hasError ? errorState : null
  };
};

export default useTimesheet;
