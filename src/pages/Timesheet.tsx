
import React, { Suspense, lazy, useState, useEffect } from "react";
import TimesheetWithErrorBoundary from "@/components/timesheet/TimesheetWithErrorBoundary";
import { 
  useUserTimesheetContext,
  useTimesheetUIContext,
  useCalendarContext
} from "@/contexts/timesheet";
import TimesheetNotFound from "@/components/timesheet/navigation/TimesheetNotFound";
import TimesheetBackNavigation from "@/components/timesheet/navigation/TimesheetBackNavigation";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryProvider";
import { initializeService } from "@/utils/time/services/api-wrapper";
import { useToast } from "@/hooks/use-toast";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";
import ErrorFallback from "@/components/common/ErrorFallback";

const logger = createTimeLogger('TimesheetPage');

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
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  
  // Initialize services if needed
  useEffect(() => {
    let mounted = true;
    
    const initServices = async () => {
      try {
        logger.debug("Initializing services for timesheet");
        await initializeService();
        
        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        logger.error("Failed to initialize services:", error);
        
        if (mounted) {
          setInitError(error instanceof Error ? error : new Error('Service initialization failed'));
          
          toast({
            title: "Service Error",
            description: "There was a problem loading the timesheet data. Try refreshing the page.",
            variant: "destructive"
          });
        }
      }
    };
    
    initServices();
    
    return () => {
      mounted = false;
    };
  }, [toast]);
  
  // Check for permission or if user exists
  if (!viewedUser || !canViewTimesheet) {
    return (
      <TimesheetNotFound 
        userExists={!!viewedUser} 
        canViewTimesheet={canViewTimesheet} 
      />
    );
  }
  
  // If we had an initialization error, show fallback
  if (initError) {
    return (
      <ErrorFallback 
        error={initError}
        resetErrorBoundary={() => window.location.reload()}
      />
    );
  }
  
  // If waiting for initialization, show loading state
  if (!isInitialized) {
    return <LoadingComponent />;
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
