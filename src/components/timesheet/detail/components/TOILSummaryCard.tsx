
import React, { memo, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TOILSummary } from "@/types/toil";
import { Clock, Bug } from "lucide-react";
import { createTimeLogger } from "@/utils/time/errors";
import { TOILErrorState } from "./toil-summary";
import { useTOILEventHandling } from "../hooks/useTOILEventHandling";
import TOILCardContent from "./toil-summary/TOILCardContent";
import { toilService, clearCache } from "@/utils/time/services/toil";
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';

// Create logger
const logger = createTimeLogger('TOILSummaryCard');

interface TOILSummaryCardProps {
  summary: TOILSummary | null;
  loading?: boolean;
  monthName?: string;
  className?: string;
  onError?: (error: string) => void;
  showRollover?: boolean;
  rolloverHours?: number;
  useSimpleView?: boolean;
  onRefreshRequest?: () => void;
}

// Main TOILSummaryCard component with improved error handling
const TOILSummaryCard: React.FC<TOILSummaryCardProps> = memo(({
  summary,
  loading = false,
  monthName,
  className,
  onError,
  showRollover = false,
  rolloverHours = 0,
  useSimpleView = false,
  onRefreshRequest
}) => {
  // Use our custom hook for event handling
  const { handleRefresh } = useTOILEventHandling(onRefreshRequest);
  
  // Add debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Force clear cache on mount to ensure fresh data
  useEffect(() => {
    logger.debug('TOILSummaryCard mounted, clearing cache');
    clearCache();
    
    // Set up a refresh interval
    const refreshInterval = setInterval(() => {
      if (onRefreshRequest) {
        logger.debug('Auto-refreshing TOIL summary');
        onRefreshRequest();
        setLastUpdated(new Date());
      }
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(refreshInterval);
  }, [onRefreshRequest]);
  
  // Log when summary changes
  useEffect(() => {
    logger.debug('TOILSummaryCard received summary update:', summary);
    
    if (summary) {
      setLastUpdated(new Date());
      
      // Re-broadcast the update to ensure all listeners get it
      eventBus.publish(TOIL_EVENTS.SUMMARY_UPDATED, {
        ...summary,
        timestamp: new Date()
      });
    }
  }, [summary]);
  
  // Special debug mode toggle with key combo (Ctrl+Alt+D)
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
  const handleManualRefresh = () => {
    logger.debug('Manual refresh requested');
    clearCache();
    if (onRefreshRequest) {
      onRefreshRequest();
      setLastUpdated(new Date());
    }
  };
  
  try {
    logger.debug('TOILSummaryCard rendering with summary:', summary, 'loading:', loading);
    
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
            
            {/* Debug indicator - fixed: removed 'title' prop and use aria-label instead */}
            {debugMode && (
              <Bug 
                size={16} 
                className="ml-2 text-amber-500"
                onClick={handleManualRefresh}
                aria-label="Click to force refresh"
              />
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
          
          {/* Debug info area */}
          {debugMode && (
            <div className="mt-4 p-2 border border-amber-200 bg-amber-50 rounded text-xs font-mono">
              <div>Last update: {lastUpdated.toLocaleTimeString()}</div>
              <div>Cache valid: {toilService.isInitialized() ? "Yes" : "No"}</div>
              <div>
                Summary: {summary ? `A:${summary.accrued} U:${summary.used} R:${summary.remaining}` : "None"}
              </div>
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
    
    return <TOILErrorState error={err instanceof Error ? err : String(err)} />;
  }
});

TOILSummaryCard.displayName = 'TOILSummaryCard';

export default memo(TOILSummaryCard);
