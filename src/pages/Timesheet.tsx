
import React, { Suspense, lazy } from "react";
import TimesheetWithErrorBoundary from "@/components/timesheet/TimesheetWithErrorBoundary";
import { 
  useUserTimesheetContext,
  useTimesheetUIContext,
  useCalendarContext
} from "@/contexts/timesheet";
import TimesheetNotFound from "@/components/timesheet/navigation/TimesheetNotFound";
import TimesheetBackNavigation from "@/components/timesheet/navigation/TimesheetBackNavigation";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryProvider";

// Lazy-loaded components
const UserInfo = lazy(() => import("@/components/timesheet/UserInfo"));
const TimesheetTabs = lazy(() => import("@/components/timesheet/TimesheetTabs"));

// Loading placeholder
const LoadingComponent = () => (
  <div className="animate-pulse p-4 space-y-4">
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>
);

// Create a wrapper component that uses the context
const TimesheetContent = () => {
  const {
    viewedUser,
    isViewingOtherUser,
    canViewTimesheet
  } = useUserTimesheetContext();
  
  const { selectedDay } = useCalendarContext();
  
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
    <TimeEntryProvider selectedDate={selectedDay} userId={viewedUser.id}>
      <div className="container py-6 max-w-7xl">
        {/* Back button when viewing other user's timesheet */}
        <TimesheetBackNavigation 
          user={viewedUser}
          isViewingOtherUser={isViewingOtherUser}
        />

        <Suspense fallback={<LoadingComponent />}>
          <UserInfo user={viewedUser} />
        </Suspense>

        <Suspense fallback={<LoadingComponent />}>
          <TimesheetTabs />
        </Suspense>
      </div>
    </TimeEntryProvider>
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
