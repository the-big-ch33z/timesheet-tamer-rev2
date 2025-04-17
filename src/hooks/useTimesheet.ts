
import { useCalendarState } from "./timesheet/useCalendarState";
import { useTimesheetContext } from "./timesheet/useTimesheetContext";
import { useUnifiedTimeEntries } from "./useUnifiedTimeEntries";
import { useLogger } from "./useLogger";

/**
 * Primary hook for timesheet functionality
 * Combines calendar state, timesheet context and unified time entries
 */
export const useTimesheet = () => {
  const logger = useLogger("Timesheet");
  
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
  
  // Get entries for the current user
  const {
    entries,
    isLoading: entriesLoading
  } = useUnifiedTimeEntries({
    userId: targetUserId || undefined,
    date: selectedDay,
    showToasts: false
  });
  
  logger.debug("Timesheet hook initialized", { 
    targetUserId, 
    hasViewedUser: !!viewedUser,
    canViewTimesheet,
    entriesCount: entries?.length
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
    
    // Timesheet context
    activeTab,
    targetUserId,
    isViewingOtherUser,
    viewedUser,
    canViewTimesheet,
    userWorkSchedule,
    setActiveTab
  };
};

export default useTimesheet;
