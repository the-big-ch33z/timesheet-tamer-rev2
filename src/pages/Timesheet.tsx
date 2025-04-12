
import React from "react";
import UserInfo from "@/components/timesheet/UserInfo";
import TimesheetTabs from "@/components/timesheet/TimesheetTabs";
import TimesheetBackNavigation from "@/components/timesheet/navigation/TimesheetBackNavigation";
import TimesheetNotFound from "@/components/timesheet/navigation/TimesheetNotFound";
import TimesheetWithErrorBoundary from "@/components/timesheet/TimesheetWithErrorBoundary";
import { 
  useUserTimesheetContext,
  useTimesheetUIContext,
  useEntriesContext,
  useCalendarContext
} from "@/contexts/timesheet";

// Create a wrapper component that uses the context
const TimesheetContent = () => {
  const {
    viewedUser,
    isViewingOtherUser,
    canViewTimesheet
  } = useUserTimesheetContext();
  
  const { selectedDay } = useCalendarContext();
  const { getDayEntries } = useEntriesContext();
  
  // Get entries for the selected day
  const dayEntries = selectedDay ? getDayEntries(selectedDay) : [];

  // Check for permission or if user exists
  if (!viewedUser || !canViewTimesheet) {
    return (
      <TimesheetNotFound 
        userExists={!!viewedUser} 
        canViewTimesheet={canViewTimesheet} 
      />
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      {/* Back button when viewing other user's timesheet */}
      <TimesheetBackNavigation 
        user={viewedUser}
        isViewingOtherUser={isViewingOtherUser}
      />

      <UserInfo user={viewedUser} />

      <TimesheetTabs />
    </div>
  );
};

// Main component that provides the context
const Timesheet = () => {
  return (
    <TimesheetWithErrorBoundary>
      <TimesheetContent />
    </TimesheetWithErrorBoundary>
  );
};

export default Timesheet;
