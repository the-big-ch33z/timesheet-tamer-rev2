
import React, { memo } from "react";
import { TimesheetProvider } from "@/contexts/timesheet/TimesheetContext";
import ErrorBoundary from "../common/ErrorBoundary";
import { useToast } from "@/components/ui/use-toast";

interface TimesheetWithErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Component that wraps timesheet content in an error boundary
 * Memoized to prevent unnecessary re-renders
 */
const TimesheetWithErrorBoundary: React.FC<TimesheetWithErrorBoundaryProps> = memo(({ children }) => {
  const { toast } = useToast();

  const handleTimesheetError = (error: Error) => {
    toast({
      variant: "destructive",
      title: "Timesheet Error",
      description: `An error occurred in the timesheet: ${error.message}`,
    });
  };

  return (
    <ErrorBoundary onError={handleTimesheetError}>
      <TimesheetProvider>
        {children}
      </TimesheetProvider>
    </ErrorBoundary>
  );
});

TimesheetWithErrorBoundary.displayName = 'TimesheetWithErrorBoundary';

export default TimesheetWithErrorBoundary;
