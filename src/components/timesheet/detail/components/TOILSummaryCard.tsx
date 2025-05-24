
import React, { memo, useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, Bug, RefreshCw, StopCircle, Play } from "lucide-react";
import { createTimeLogger } from "@/utils/time/errors";
import { TOILErrorState } from "./toil-summary";
import { useTOILEventHandling } from "../hooks/useTOILEventHandling";
import TOILCardContent from "./toil-summary/TOILCardContent";
import { useDebounce } from "@/hooks/useDebounce";
import { useUnifiedTOIL } from "@/hooks/timesheet/toil/useUnifiedTOIL";
import { eventBus } from "@/utils/events/EventBus";
import { TIME_ENTRY_EVENTS } from "@/utils/events/eventTypes";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/TimeEntryContext";
import { Button } from "@/components/ui/button";

// Create logger
const logger = createTimeLogger('TOILSummaryCard');

export interface TOILSummaryCardProps {
  userId: string;
  date: Date;
  monthName?: string;
  className?: string;
  onError?: (error: string) => void;
  showRollover?: boolean;
  rolloverHours?: number;
  useSimpleView?: boolean;
  workSchedule?: any;
  testProps?: {
    summary: any;
    loading: boolean;
    testModeEnabled?: boolean;
  };
}

const TOILSummaryCard: React.FC<TOILSummaryCardProps> = memo(({
  userId,
  date,
  monthName,
  className,
  onError,
  showRollover = false,
  rolloverHours = 0,
  useSimpleView = false,
  workSchedule,
  testProps
}) => {
  // Access TimeEntryContext to get the actual entries and watch for changes
  const timeEntryContext = useTimeEntryContext();
  
  // Get month entries for the user - this will update when entries change
  const monthEntries = timeEntryContext.getMonthEntries(date, userId);
  
  // Track entries array reference to detect changes
  const [entriesVersion, setEntriesVersion] = useState(0);
  
  logger.debug(`TOILSummaryCard: Found ${monthEntries.length} entries for ${userId} in month ${date.toISOString()}`);
  
  // Only use test props if testModeEnabled is true
  const enhancedTestProps = testProps && testProps.testModeEnabled ? {
    ...testProps,
    testModeEnabled: true
  } : undefined;
  
  // Use our unified TOIL hook with circuit breaker and increased refresh interval
  const {
    toilSummary: summary,
    isLoading: loading,
    error,
    refreshSummary,
    circuitBreakerStatus,
    stopCalculations,
    resumeCalculations
  } = useUnifiedTOIL({
    userId,
    date,
    entries: monthEntries, // Pass the actual entries
    workSchedule, // Pass the work schedule
    options: {
      monthOnly: true,
      refreshInterval: 10000, // Increased to 10 seconds
      testProps: enhancedTestProps
    }
  });

  // Use our custom hook for event handling with increased debounce
  const { handleRefresh } = useTOILEventHandling(refreshSummary);
  
  // Add debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Force refresh of entries and TOIL calculation with circuit breaker check
  const forceRefresh = useCallback(() => {
    if (circuitBreakerStatus.globallyDisabled) {
      logger.debug('Force refresh blocked by circuit breaker');
      return;
    }
    
    logger.debug('Forcing refresh of TOIL summary and entries');
    setIsRefreshing(true);
    
    // Increment entries version to trigger recalculation
    setEntriesVersion(prev => prev + 1);
    
    // Refresh the summary
    refreshSummary();
    setLastUpdated(new Date());
    setRefreshAttempts(prev => prev + 1);
    
    setTimeout(() => setIsRefreshing(false), 1000); // Increased timeout
  }, [refreshSummary, circuitBreakerStatus.globallyDisabled]);
  
  // Debounce the refresh function with longer delay
  const debouncedRefresh = useDebounce(() => {
    logger.debug('Requesting refresh of TOIL summary (debounced)');
    forceRefresh();
  }, 2000); // Increased from 100ms to 2000ms
  
  // Watch for changes in the entries array length or content with conservative approach
  useEffect(() => {
    logger.debug(`Entries changed: ${monthEntries.length} entries, considering TOIL recalculation`);
    
    // Only trigger if we have a meaningful change and circuit breaker allows it
    if (monthEntries.length >= 0 && !circuitBreakerStatus.globallyDisabled) {
      debouncedRefresh();
    }
  }, [monthEntries.length, debouncedRefresh, circuitBreakerStatus.globallyDisabled]);
  
  // Report errors to parent component
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);
  
  // Log when summary changes
  useEffect(() => {
    if (summary) {
      logger.debug('TOILSummaryCard received summary update:', summary);
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
  }, [summary]);
  
  // Add listener for time entry events with MUCH longer debounce
  useEffect(() => {
    const handleEntryEvent = (eventData: any) => {
      if (circuitBreakerStatus.globallyDisabled) {
        logger.debug('Entry event ignored due to circuit breaker');
        return;
      }
      
      logger.debug('Time entry event received, considering TOIL refresh:', eventData);
      
      // Check if this event is relevant to our user and month
      const isRelevant = eventData?.userId === userId || 
                        eventData?.payload?.userId === userId ||
                        !eventData?.userId; // If no userId specified, assume it's relevant
      
      if (isRelevant) {
        logger.debug('Event is relevant, scheduling refresh with longer delay');
        // Use much longer timeout to prevent cascading
        setTimeout(() => {
          if (!circuitBreakerStatus.globallyDisabled) {
            forceRefresh();
          }
        }, 3000); // 3 second delay
      }
    };
    
    const sub1 = eventBus.subscribe(TIME_ENTRY_EVENTS.DELETED, handleEntryEvent);
    const sub2 = eventBus.subscribe(TIME_ENTRY_EVENTS.CREATED, handleEntryEvent);
    const sub3 = eventBus.subscribe(TIME_ENTRY_EVENTS.UPDATED, handleEntryEvent);
    
    return () => {
      if (typeof sub1 === 'function') sub1();
      if (typeof sub2 === 'function') sub2();
      if (typeof sub3 === 'function') sub3();
    };
  }, [userId, forceRefresh, circuitBreakerStatus.globallyDisabled]);
  
  // Debug mode toggle (Ctrl+Alt+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'd') {
        setDebugMode(prev => !prev);
        logger.debug(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugMode]);
  
  // Manual refresh handling
  const handleManualRefresh = useCallback(() => {
    logger.debug('Manual refresh requested');
    forceRefresh();
  }, [forceRefresh]);
  
  // Refresh on mount with delay
  useEffect(() => {
    logger.debug('TOILSummaryCard mounted, requesting initial refresh with delay');
    setTimeout(() => {
      refreshSummary();
    }, 1000); // Delay initial refresh to prevent cascading
  }, [refreshSummary]);
  
  try {
    return (
      <Card 
        className={`bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl
          transition-shadow hover:shadow-xl ${className || ''}`}
        style={{ minWidth: 300 }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-blue-700 tracking-tight flex items-center gap-2 mb-2">
            <Clock className="w-6 h-6 text-blue-400" />
            TOIL Summary {monthName}
            
            <RefreshCw 
              size={16} 
              className={`ml-auto cursor-pointer text-blue-400 hover:text-blue-600 transition-colors
                ${isRefreshing ? 'animate-spin' : ''}`}
              onClick={handleManualRefresh}
              aria-label="Refresh TOIL data"
            />
            
            {debugMode && (
              <>
                <Bug 
                  size={16} 
                  className="ml-2 text-amber-500"
                  onClick={handleManualRefresh}
                  aria-label="Click to force refresh"
                />
                {circuitBreakerStatus.globallyDisabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resumeCalculations}
                    className="ml-2 h-6 px-2 text-xs"
                  >
                    <Play size={12} className="mr-1" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopCalculations}
                    className="ml-2 h-6 px-2 text-xs"
                  >
                    <StopCircle size={12} className="mr-1" />
                    Stop
                  </Button>
                )}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TOILCardContent
            summary={summary}
            loading={loading}
            useSimpleView={useSimpleView}
            showRollover={showRollover}
            rolloverHours={rolloverHours}
            onError={onError}
          />
          
          {debugMode && (
            <div className="mt-4 p-2 border border-amber-200 bg-amber-50 rounded text-xs font-mono">
              <div>Last update: {lastUpdated.toLocaleTimeString()}</div>
              <div>Refresh attempts: {refreshAttempts}/10</div>
              <div>Loading state: {loading ? 'Loading' : 'Ready'}</div>
              <div>Entries count: {monthEntries.length}</div>
              <div>Entries version: {entriesVersion}</div>
              <div>Work schedule: {workSchedule ? workSchedule.name : 'None'}</div>
              <div>Circuit breaker: {circuitBreakerStatus.globallyDisabled ? 'DISABLED' : 'Active'}</div>
              <div>Calculations in progress: {circuitBreakerStatus.calculationsInProgress}</div>
              <div>
                Summary: {summary ? `A:${summary.accrued.toFixed(1)} U:${summary.used.toFixed(1)} R:${summary.remaining.toFixed(1)}` : "None"}
              </div>
              {error && <div className="text-red-500">Error: {error}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch (err) {
    logger.error("TOILSummaryCard crashed while rendering:", err);
    
    if (onError) {
      onError(`Error rendering TOIL summary: ${String(err)}`);
    }
    
    return <TOILErrorState error={err instanceof Error ? err : String(err)} onRetry={refreshSummary} />;
  }
});

TOILSummaryCard.displayName = 'TOILSummaryCard';

export default memo(TOILSummaryCard);
