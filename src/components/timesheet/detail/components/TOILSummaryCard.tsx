
import React, { memo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TOILSummary } from "@/types/toil";
import { Clock } from "lucide-react";
import { createTimeLogger } from "@/utils/time/errors";
import { TOILErrorState } from "./toil-summary";
import { useTOILEventHandling } from "../hooks/useTOILEventHandling";
import TOILCardContent from "./toil-summary/TOILCardContent";
import { toilService } from "@/utils/time/services/toil";

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
  
  // Force clear cache on mount to ensure fresh data
  useEffect(() => {
    logger.debug('TOILSummaryCard mounted, clearing cache');
    toilService.clearCache();
    
    // Set up a refresh interval
    const refreshInterval = setInterval(() => {
      if (onRefreshRequest) {
        logger.debug('Auto-refreshing TOIL summary');
        onRefreshRequest();
      }
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(refreshInterval);
  }, [onRefreshRequest]);
  
  // Log when summary changes
  useEffect(() => {
    logger.debug('TOILSummaryCard received summary update:', summary);
  }, [summary]);
  
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
