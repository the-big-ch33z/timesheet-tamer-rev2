
import React, { Suspense, lazy, useState, useEffect } from "react";
import TimesheetWithErrorBoundary from "@/components/timesheet/TimesheetWithErrorBoundary";
import {
  useUserTimesheetContext,
  useCalendarContext,
  useTimesheetUIContext,
  TimesheetUIProvider
} from "@/contexts/timesheet";
import TimesheetNotFound from "@/components/timesheet/navigation/TimesheetNotFound";
import TimesheetBackNavigation from "@/components/timesheet/navigation/TimesheetBackNavigation";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryContext";
import { initializeService, areServicesInitialized, getInitializationError } from "@/utils/time/services/api-wrapper";
import { useToast } from "@/components/ui/use-toast";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";
import ErrorFallback from "@/components/common/ErrorFallback";

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

const logger = createTimeLogger("TimesheetPage");

/**
 * Timesheet Content Component
 * This component is wrapped by TimesheetWithErrorBoundary and consumes
 * the timesheet contexts from the provider hierarchy
 */
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
  const [initAttempts, setInitAttempts] = useState(0);
  const maxInitAttempts = 3;

  // Initialize services if needed
  useEffect(() => {
    let mounted = true;

    const initServices = async () => {
      // Check if services are already initialized
      if (areServicesInitialized()) {
        logger.debug("Services already initialized");
        if (mounted) setIsInitialized(true);
        return;
      }
      
      try {
        logger.debug("Initializing services for timesheet");
        await initializeService();

        if (mounted) {
          setIsInitialized(true);
          setInitError(null);
          logger.debug("Services initialized successfully");
        }
      } catch (error) {
        logger.error("Failed to initialize services:", error);

        if (mounted) {
          const errorToUse = error instanceof Error ? error : new Error("Service initialization failed");
          setInitError(errorToUse);
          setInitAttempts(prev => prev + 1);

          toast({
            title: "Service Error",
            description: "There was a problem loading the timesheet data. Retrying...",
            variant: "destructive"
          });
          
          // Auto-retry initialization
          if (initAttempts < maxInitAttempts) {
            logger.debug(`Retrying initialization (attempt ${initAttempts + 1}/${maxInitAttempts})`);
            setTimeout(initServices, 1000); // Retry after a delay
          }
        }
      }
    };

    initServices();

    return () => {
      mounted = false;
    };
  }, [toast, initAttempts]);

  // Check for permission or if user exists
  if (!viewedUser || !canViewTimesheet) {
    return (
      <TimesheetNotFound
        userExists={!!viewedUser}
        canViewTimesheet={canViewTimesheet}
      />
    );
  }

  // If we hit the max retry attempts, show error
  if (initAttempts >= maxInitAttempts && initError) {
    return (
      <ErrorFallback
        error={initError}
        resetErrorBoundary={() => {
          setInitAttempts(0);
          window.location.reload();
        }}
      />
    );
  }

  // If we had an initialization error but still have retries left, show loading
  if (initError && initAttempts < maxInitAttempts) {
    return (
      <div className="container py-6 max-w-7xl">
        <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200 mb-4">
          <h3 className="text-yellow-800 font-medium">Initializing Services</h3>
          <p className="text-yellow-700">Attempting to connect to timesheet services... (Attempt {initAttempts + 1}/{maxInitAttempts})</p>
        </div>
        <LoadingComponent />
      </div>
    );
  }

  // If waiting for initialization, show loading state
  if (!isInitialized) {
    return <LoadingComponent />;
  }

  return (
    <TimeEntryProvider selectedDate={selectedDay} userId={viewedUser.id}>
      <TimesheetUIProvider>
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
      </TimesheetUIProvider>
    </TimeEntryProvider>
  );
};

/**
 * Main Timesheet Page Component
 * Provides error boundary and context providers
 */
const Timesheet = () => {
  return (
    <TimesheetWithErrorBoundary>
      <TimesheetContent />
    </TimesheetWithErrorBoundary>
  );
};

export default Timesheet;
