
import React, { memo, useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, Bug, RefreshCw, StopCircle, Play } from "lucide-react";
import { createTimeLogger } from "@/utils/time/errors";
import { TOILErrorState } from "./toil-summary";
import { useTOILEventHandling } from "../hooks/useTOILEventHandling";
import TOILCardContent from "./toil-summary/TOILCardContent";
import { useUnifiedTOIL } from "@/hooks/timesheet/toil/useUnifiedTOIL";
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
  // Access TimeEntryContext to get the actual entries
  const timeEntryContext = useTimeEntryContext();
  
  // Get month entries for the user - this will update when entries change
  const monthEntries = timeEntryContext.getMonthEntries(date, userId);
  
  logger.debug(`TOILSummaryCard: Found ${monthEntries.length} entries for ${userId} in month ${date.toISOString()}`);
  
  // Only use test props if testModeEnabled is true
  const enhancedTestProps = testProps && testProps.testModeEnabled ? {
    ...testProps,
    testModeEnabled: true
  } : undefined;
  
  // Use our unified TOIL hook with conservative refresh settings
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
      refreshInterval: 30000, // Conservative 30 second interval
      testProps: enhancedTestProps
    }
  });

  // Use our custom hook for event handling with much longer debounce
  const { handleRefresh } = useTOILEventHandling(refreshSummary);
  
  // Add debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Simple manual refresh without forcing aggressive updates
  const handleManualRefresh = useCallback(() => {
    if (circuitBreakerStatus.globallyDisabled) {
      logger.debug('Manual refresh blocked by circuit breaker');
      return;
    }
    
    logger.debug('Manual refresh requested');
    setIsRefreshing(true);
    refreshSummary();
    setLastUpdated(new Date());
    
    setTimeout(() => setIsRefreshing(false), 2000);
  }, [refreshSummary, circuitBreakerStatus.globallyDisabled]);
  
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
  
  // Initial refresh on mount with delay to prevent cascading
  useEffect(() => {
    logger.debug('TOILSummaryCard mounted, requesting initial refresh with delay');
    const timeoutId = setTimeout(() => {
      refreshSummary();
    }, 2000); // 2 second delay to prevent mount cascades
    
    return () => clearTimeout(timeoutId);
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
              <div>Loading state: {loading ? 'Loading' : 'Ready'}</div>
              <div>Entries count: {monthEntries.length}</div>
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
