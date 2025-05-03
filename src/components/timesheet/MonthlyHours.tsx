
import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, WorkSchedule } from "@/types";
import MonthSummary from "./MonthSummary";
import TOILSummaryCard from "./detail/components/TOILSummaryCard";
import { useTOILSummary } from "@/hooks/timesheet/useTOILSummary";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";
import { Button } from "@/components/ui/button";

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

  const monthName = format(currentMonth, 'MMMM yyyy');
  
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
    }
  }, [toilSummary, toilLoading, toilError, monthName, user.id]);
  
  // Force a refresh when the component mounts to ensure data is loaded
  useEffect(() => {
    logger.debug(`MonthlyHours component mounted, forcing refresh for ${user.id}, ${monthName}`);
    refreshSummary();
  }, [refreshSummary, user.id, monthName]);

  return (
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
        {toilError ? (
          <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">
            Failed to load TOIL summary: {toilError}
            <Button 
              onClick={refreshSummary} 
              className="ml-2 underline text-blue-500"
              variant="ghost"
              size="sm"
            >
              Retry
            </Button>
          </div>
        ) : (
          <TOILSummaryCard
            summary={toilSummary}
            loading={toilLoading}
            monthName={monthName}
          />
        )}
      </div>
    </div>
  );
};

export default MonthlyHours;
