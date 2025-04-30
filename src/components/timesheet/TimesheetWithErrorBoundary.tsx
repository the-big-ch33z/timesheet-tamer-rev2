
import React, { memo } from "react";
import { TimesheetProvider } from "@/contexts/timesheet/TimesheetContext";
import ErrorBoundary from "../common/ErrorBoundary";
import { useToast } from "@/components/ui/use-toast";
import { createTimeLogger } from "@/utils/time/errors/timeLogger";
import ErrorFallback from "@/components/common/ErrorFallback";

const logger = createTimeLogger('TimesheetWithErrorBoundary');

interface TimesheetWithErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Component that wraps timesheet content in an error boundary
 * Improved with better error handling and recovery options
 * Memoized to prevent unnecessary re-renders
 */
const TimesheetWithErrorBoundary: React.FC<TimesheetWithErrorBoundaryProps> = memo(({ children }) => {
  const { toast } = useToast();

  const handleTimesheetError = (error: Error) => {
    logger.error("Timesheet error caught:", error);
    
    // Show a toast notification for the error
    toast({
      variant: "destructive",
      title: "Timesheet Error",
      description: "There was a problem with the timesheet. Please try again.",
    });
    
    // Optionally report to an error monitoring service here
  };
  
  // Create a specialized fallback for timesheet errors
  const renderTimeSheetErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div className="container py-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow p-6">
        <ErrorFallback 
          error={error} 
          resetErrorBoundary={() => {
            // First try the normal reset
            resetErrorBoundary();
            
            // If it didn't work and we still have errors, try a more thorough reset
            setTimeout(() => {
              // Clear any timesheet specific storage that might be problematic
              try {
                localStorage.removeItem('timesheet-work-hours');
                localStorage.removeItem('time-entries-cache-timestamp');
              } catch (e) {
                // Ignore errors during cleanup
              }
            }, 500);
          }}
        />
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      onError={handleTimesheetError} 
      fallbackComponent={renderTimeSheetErrorFallback}
    >
      <TimesheetProvider>
        {children}
      </TimesheetProvider>
    </ErrorBoundary>
  );
});

TimesheetWithErrorBoundary.displayName = 'TimesheetWithErrorBoundary';

export default TimesheetWithErrorBoundary;
