
import React from "react";
import UserInfo from "@/components/timesheet/UserInfo";
import TimesheetEntryDetail from "@/components/timesheet/TimesheetEntryDetail";
import TimesheetTabs from "@/components/timesheet/TimesheetTabs";
import TimesheetBackNavigation from "@/components/timesheet/navigation/TimesheetBackNavigation";
import TimesheetNotFound from "@/components/timesheet/navigation/TimesheetNotFound";
import { TimesheetProvider, useTimesheetContext } from "@/contexts/timesheet";

// Create a wrapper component that uses the context
const TimesheetContent = () => {
  const {
    selectedDay,
    activeTab,
    isViewingOtherUser,
    viewedUser,
    canViewTimesheet,
    getDayEntries,
  } = useTimesheetContext();

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

      {selectedDay && activeTab === "timesheet" && (
        <div className="mb-8">
          <TimesheetEntryDetail 
            date={selectedDay}
            entries={getDayEntries(selectedDay)}
          />
        </div>
      )}
    </div>
  );
};

// Main component that provides the context
const Timesheet = () => {
  return (
    <TimesheetProvider>
      <TimesheetContent />
    </TimesheetProvider>
  );
};

export default Timesheet;
