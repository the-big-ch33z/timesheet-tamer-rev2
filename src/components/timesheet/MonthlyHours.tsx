
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, WorkSchedule } from "@/types";
import MonthSummary from "./MonthSummary";
import TOILSummaryCard from "./detail/components/TOILSummaryCard";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";
import { useToast } from "@/components/ui/use-toast";
import { TOILEventProvider } from "@/utils/time/events/toil";
import { TOIL_EVENTS, TOILEventData } from '@/utils/events/eventTypes';
import { eventBus } from '@/utils/events/EventBus';
import { useUnifiedTOIL } from "@/hooks/timesheet/toil/useUnifiedTOIL";

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
  // Use our unified TOIL hook for fallback data
  const {
    toilSummary,
    isLoading: toilLoading,
    error: toilError,
    refreshSummary
  } = useUnifiedTOIL({
    userId: user.id,
    date: currentMonth,
    options: {
      monthOnly: true,
      refreshInterval: 120000
    }
  });
  
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rolloverHours, setRolloverHours] = useState<number>(0);
  const [refreshCount, setRefreshCount] = useState(0);

  const monthName = useMemo(() => format(currentMonth, 'MMMM yyyy'), [currentMonth]);
  const monthYear = useMemo(() => format(currentMonth, 'yyyy-MM'), [currentMonth]);
  
  // Handle TOIL errors from the card component
  const handleTOILError = useCallback((error: string) => {
    logger.error(`TOIL error from summary card: ${error}`);
    setErrorMessage(error);
  }, []);
  
  useEffect(() => {
    logger.debug(`MonthlyHours component for ${monthName}:`, {
      userId: user.id,
      toilSummary,
      toilLoading,
      toilError,
      workSchedule: workSchedule?.name || 'None'
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
    if (toilSummary && toilSummary.remaining > 0) {
      const calculatedRollover = Math.min(toilSummary.remaining, 16);
      setRolloverHours(calculatedRollover);
    } else {
      setRolloverHours(0);
    }
  }, [toilSummary, toilLoading, toilError, monthName, user.id, toast, workSchedule]);
  
  // Subscribe to TOIL events to update based on changes
  useEffect(() => {
    const subscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: TOILEventData) => {
      const dataMatchesMonth = 
        (data && data.userId === user.id && data.monthYear === monthYear) || 
        (data && data.userId === user.id && data.date?.startsWith(monthYear));
      
      if (dataMatchesMonth) {
        logger.debug('Received TOIL_EVENTS.SUMMARY_UPDATED in MonthlyHours:', data);
        refreshSummary();
        setRefreshCount(prev => prev + 1);
      }
    });
    
    return () => {
      if (typeof subscription === 'function') subscription();
    };
  }, [refreshSummary, user.id, monthYear]);

  return (
    <TOILEventProvider>
      <div className="flex flex-col gap-8 w-full">
        {/* Monthly Summary card */}
        <div className="w-full max-w-full">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl hover:shadow-xl transition-shadow group">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-blue-700 mb-2">
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
        
        {/* TOIL Summary card with work schedule passed */}
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
              key={`toil-summary-${refreshCount}`}
              userId={user.id}
              date={currentMonth}
              monthName={monthName}
              workSchedule={workSchedule}
              onError={handleTOILError}
              showRollover={rolloverHours > 0}
              rolloverHours={rolloverHours}
              useSimpleView={false}
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
