
import { useCalendarState } from "./timesheet/useCalendarState";
import { useEntryManagement } from "./timesheet/useEntryManagement";
import { useTimesheetContext } from "./timesheet/useTimesheetContext";
import { useLogger } from "./useLogger";
import { TimeEntry } from "@/types";

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
  
  const {
    deleteEntry,
    getUserEntries,
    getDayEntries,
    addEntry
  } = useEntryManagement(targetUserId);
  
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
    setActiveTab,
    
    // Entry management
    deleteEntry,
    getUserEntries,
    getDayEntries,
    addEntry
  };
};
