
import React, { Suspense, lazy, useState, useEffect } from "react";
import TimesheetWithErrorBoundary from "@/components/timesheet/TimesheetWithErrorBoundary";
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

/**
 * Timesheet Content Component
 * This component is wrapped by TimesheetWithErrorBoundary and consumes
 * the timesheet contexts from the provider hierarchy
 */
const TimesheetContent = () => {
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
    <div className="container py-6 max-w-7xl">
      <Suspense fallback={<LoadingComponent />}>
        <UserInfo />
      </Suspense>

      <Suspense fallback={<LoadingComponent />}>
        <TimesheetTabs />
      </Suspense>
    </div>
  );
};

/**
 * Main Timesheet Page Component
 * Provides error boundary and context providers
 */
const Timesheet = () => {
  console.log("Rendering Timesheet component");
  return (
    <TimesheetWithErrorBoundary>
      <TimesheetContent />
    </TimesheetWithErrorBoundary>
  );
};

export default Timesheet;
