
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, WorkSchedule } from "@/types";
import MonthSummary from "./MonthSummary";
import TOILSummaryCard from "./detail/components/TOILSummaryCard";
import { useTOILSummary } from "@/hooks/timesheet/useTOILSummary";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";
import { toast } from "@/hooks/use-toast";
import { TOILEventProvider } from "@/utils/time/events/toilEventService";

// Create a logger for this component
const logger = createTimeLogger('MonthlyHours');

interface MonthlyHoursProps {
  user: User;
  currentMonth: Date;
  workSchedule?: WorkSchedule;
}

const MonthlyHours: React.FC<MonthlyHoursProps> = ({
  user,
  currentMonth,
  workSchedule
}) => {
  // Get TOIL summary for the current month, using monthOnly=true to ensure
  // it doesn't change when day selection changes
  const { summary: toilSummary, isLoading: toilLoading, error: toilError, refreshSummary } = useTOILSummary({
    userId: user.id,
    date: currentMonth,
    monthOnly: true // Explicitly set to use month-only mode
  });
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rolloverHours, setRolloverHours] = useState<number>(0);

  const monthName = format(currentMonth, 'MMMM yyyy');
  
  // Handle TOIL errors from the card component
  const handleTOILError = (error: string) => {
    logger.error(`TOIL error from summary card: ${error}`);
    setErrorMessage(error);
  };
  
  // Add logging to help debug the TOIL summary
  useEffect(() => {
    logger.debug(`MonthlyHours component for ${monthName}:`, {
      userId: user.id,
      toilSummary,
      toilLoading,
      toilError
    });
    
    if (toilError) {
      logger.error(`Error loading TOIL summary for ${monthName}:`, toilError);
      setErrorMessage(toilError);
      
      toast({
        title: "TOIL Data Error",
        description: `Could not load your TOIL data: ${toilError}`,
        variant: "destructive"
      });
    }
    
    // Calculate rollover hours when summary changes
    // This is a simplified example - in production you'd get this from a service
    if (toilSummary && toilSummary.remaining > 0) {
      // Just for demonstration - usually this would come from a real calculation
      const calculatedRollover = Math.min(toilSummary.remaining, 16); // Cap at 16 hours for example
      setRolloverHours(calculatedRollover);
    } else {
      setRolloverHours(0);
    }
  }, [toilSummary, toilLoading, toilError, monthName, user.id]);
  
  // Force a refresh when the component mounts to ensure data is loaded
  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  return (
    <TOILEventProvider>
      <div className="flex flex-col gap-8 w-full">
        {/* 1. Monthly Summary card comes FIRST */}
        <div className="w-full max-w-full">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl hover:shadow-xl transition-shadow group">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-blue-700 mb-2">
                {/* Monthly Summary title handled inside MonthSummary */}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthSummary
                userId={user.id}
                date={currentMonth}
                workSchedule={workSchedule}
              />
            </CardContent>
          </Card>
        </div>
        {/* 2. TOIL Summary card below */}
        <div className="w-full max-w-full">
          {toilError && !toilSummary ? (
            <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg flex flex-col gap-2">
              <div>Failed to load TOIL summary: {toilError}</div>
              <button 
                onClick={refreshSummary} 
                className="ml-2 px-4 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <TOILSummaryCard
              summary={toilSummary}
              loading={toilLoading}
              monthName={monthName}
              onError={handleTOILError}
              showRollover={rolloverHours > 0}
              rolloverHours={rolloverHours}
            />
          )}
          
          {errorMessage && !toilError && (
            <div className="mt-2 text-amber-600 text-xs">
              <span className="font-medium">Note:</span> {errorMessage}
            </div>
          )}
        </div>
      </div>
    </TOILEventProvider>
  );
};

export default MonthlyHours;
