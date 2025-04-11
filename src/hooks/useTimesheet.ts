
import { useCalendarState } from "./timesheet/useCalendarState";
import { useTimesheetContext } from "./timesheet/useTimesheetContext";
import { useLogger } from "./useLogger";

/**
 * Primary hook for timesheet functionality
 * Combines calendar state and timesheet context
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
  
  logger.debug("Timesheet hook initialized", { 
    targetUserId, 
    hasViewedUser: !!viewedUser,
    canViewTimesheet 
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
