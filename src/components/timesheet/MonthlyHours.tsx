
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, WorkSchedule } from "@/types";
import MonthSummary from "./MonthSummary";
import TOILSummaryCard from "./detail/components/TOILSummaryCard";
import { useTOILSummary } from "@/hooks/timesheet/useTOILSummary";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";
import { useToast } from "@/hooks/use-toast";
import { TOILEventProvider } from "@/utils/time/events/toil";
import { clearCacheForCurrentMonth } from "@/utils/time/services/toil";
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { eventBus } from '@/utils/events/EventBus';
import { useDebounce } from "@/hooks/useDebounce";
import { unifiedTOILEventService } from "@/utils/time/services/toil/unifiedEventService";

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
  
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rolloverHours, setRolloverHours] = useState<number>(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  // Memoize these values to prevent unnecessary renders
  const monthName = useMemo(() => format(currentMonth, 'MMMM yyyy'), [currentMonth]);
  const monthYear = useMemo(() => format(currentMonth, 'yyyy-MM'), [currentMonth]);
  
  // Handle TOIL errors from the card component
  const handleTOILError = useCallback((error: string) => {
    logger.error(`TOIL error from summary card: ${error}`);
    setErrorMessage(error);
  }, []);
  
  // Create debounced refresh function
  const debouncedRefresh = useDebounce(() => {
    logger.debug('Executing debounced refresh');
    refreshSummary();
    setRefreshCount(prev => prev + 1);
  }, 2000);
  
  // Handle refresh request from the card - with debounce protection
  const handleRefreshRequest = useCallback(() => {
    const now = Date.now();
    // Debounce refresh requests to prevent infinite loops - only allow refresh every 2 seconds
    if (now - lastRefreshTime < 2000) {
      logger.debug('Skipping refresh request due to debounce protection');
      return;
    }
    
    logger.debug('Refresh requested from TOILSummaryCard');
    setLastRefreshTime(now);
    clearCacheForCurrentMonth(user.id, currentMonth);
    debouncedRefresh();
    
    // Broadcast a global refresh event using the unified service
    eventBus.publish(TOIL_EVENTS.REFRESH_REQUESTED, {
      userId: user.id,
      monthYear,
      timestamp: new Date()
    }, { debounce: 5000 }); // Use debounce to prevent event storms
  }, [debouncedRefresh, user.id, monthYear, lastRefreshTime, currentMonth]);
  
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
      
      // Use the unified service to dispatch the error
      unifiedTOILEventService.dispatchTOILErrorEvent(
        `Error loading TOIL summary: ${toilError}`,
        { monthYear },
        user.id
      );
      
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
  }, [toilSummary, toilLoading, toilError, monthName, user.id, toast, monthYear]);
  
  // Force a refresh when the component mounts or month changes, but with circuit breaker
  useEffect(() => {
    logger.debug(`MonthlyHours component mounted or month changed, refreshing summary for ${user.id}`);
    
    // Clear cache and refresh summary once on mount/change
    clearCacheForCurrentMonth(user.id, currentMonth);
    refreshSummary();
    
    // Set up a less frequent refresh interval
    const refreshInterval = setInterval(() => {
      logger.debug('Periodic refresh of TOIL summary');
      refreshSummary();
    }, 120000); // Refresh every 2 minutes instead of 60 seconds
    
    // Subscribe to TOIL calculation events using the unified service's handler
    const toilUpdateHandler = unifiedTOILEventService.createTOILUpdateHandler(
      user.id,
      monthYear,
      {
        onValidUpdate: (summary) => {
          logger.debug('Received valid TOIL update in MonthlyHours:', summary);
          // We don't need to set the summary directly as useTOILSummary will handle it
          // Just trigger a refresh to ensure we get the latest data
          refreshSummary();
        },
        onRefresh: () => {
          logger.debug('TOIL update requested refresh in MonthlyHours');
          refreshSummary();
        }
      }
    );
    
    // Add event listener for DOM events (backward compatibility)
    window.addEventListener('toil:summary-updated', toilUpdateHandler as EventListener);
    
    // Subscribe to EventBus events
    const subscription = eventBus.subscribe(TOIL_EVENTS.SUMMARY_UPDATED, (data: any) => {
      if (data && data.userId === user.id && data.monthYear === monthYear) {
        logger.debug('Received TOIL_EVENTS.SUMMARY_UPDATED in MonthlyHours:', data);
        refreshSummary();
      }
    });
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('toil:summary-updated', toilUpdateHandler as EventListener);
      if (typeof subscription === 'function') subscription();
    };
  }, [refreshSummary, user.id, currentMonth, monthYear]);

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
                onClick={() => {
                  clearCacheForCurrentMonth(user.id, currentMonth);
                  refreshSummary();
                }} 
                className="ml-2 px-4 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <TOILSummaryCard
              key={`toil-summary-${refreshCount}`}
              summary={toilSummary}
              loading={toilLoading}
              monthName={monthName}
              onError={handleTOILError}
              showRollover={rolloverHours > 0}
              rolloverHours={rolloverHours}
              useSimpleView={false}
              onRefreshRequest={handleRefreshRequest}
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
