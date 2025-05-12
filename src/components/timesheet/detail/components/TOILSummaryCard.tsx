
import React, { memo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TOILSummary } from "@/types/toil";
import { Clock } from "lucide-react";
import { useTOILEvents } from "@/utils/time/events/toilEventService";

import {
  TOILSummaryBoxes,
  TOILLoadingState,
  TOILEmptyState,
  TOILErrorState,
  TOILNegativeBalanceWarning,
  TOILProgressBar
} from "./toil-summary";

interface TOILSummaryCardProps {
  summary: TOILSummary | null;
  loading?: boolean;
  monthName?: string;
  className?: string;
  onError?: (error: string) => void;
  showRollover?: boolean;
  rolloverHours?: number;
}

// Main TOILSummaryCard component with improved error handling
const TOILSummaryCard: React.FC<TOILSummaryCardProps> = memo(({
  summary,
  loading = false,
  monthName,
  className,
  onError,
  showRollover = false,
  rolloverHours = 0
}) => {
  // Subscribe to TOIL events if available
  const toilEvents = React.useRef<ReturnType<typeof useTOILEvents> | null>(null);
  
  try {
    toilEvents.current = useTOILEvents();
  } catch (e) {
    // Context not available, continue without it
    console.debug('TOIL Events context not available');
  }
  
  // Subscribe to TOIL updates
  useEffect(() => {
    if (!toilEvents.current) return;
    
    const unsubscribe = toilEvents.current.subscribe('toil-updated', (event) => {
      console.log('TOIL update event received:', event);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  try {
    console.log('TOILSummaryCard received summary:', summary, 'loading:', loading);
    
    // Validate the summary data
    const hasSummary = summary !== null && summary !== undefined;
    const hasValidStructure = hasSummary && 
      typeof summary === 'object' && 
      'accrued' in summary &&
      'used' in summary &&
      'remaining' in summary;
    
    // Safety checks for null or invalid summary
    if (!hasSummary && !loading) {
      console.warn('TOILSummaryCard received null summary and not in loading state');
      
      if (onError) {
        onError('No TOIL data available');
      }
    }
    
    // Default values
    const accrued = hasValidStructure ? summary.accrued : 0;
    const used = hasValidStructure ? summary.used : 0;
    const remaining = hasValidStructure ? summary.remaining : 0;
    
    // Additional validation
    if (hasValidStructure && (isNaN(accrued) || isNaN(used) || isNaN(remaining))) {
      console.error('TOILSummaryCard received invalid numeric values:', { accrued, used, remaining });
      
      if (onError) {
        onError('TOIL data contains invalid numeric values');
      }
    }
    
    const isNegativeBalance = remaining < 0;
    const hasNoTOILActivity = loading || (accrued === 0 && used === 0);
    
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
          {loading ? (
            <TOILLoadingState />
          ) : hasNoTOILActivity ? (
            <TOILEmptyState />
          ) : (
            <>
              <TOILSummaryBoxes 
                accrued={accrued} 
                used={used} 
                remaining={remaining} 
                onError={onError}
              />

              {isNegativeBalance && <TOILNegativeBalanceWarning />}

              <TOILProgressBar 
                remaining={remaining} 
                accrued={accrued} 
                isNegativeBalance={isNegativeBalance} 
              />
              
              {/* Added rollover hours display from ToilSummary.tsx */}
              {showRollover && rolloverHours > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Roll-over TOIL</span>
                    <span className="font-semibold text-green-600">{rolloverHours.toFixed(1)} hours</span>
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground">
                    These hours have been rolled over and will be used first when taking TOIL.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  } catch (err) {
    console.error("TOILSummaryCard crashed while rendering:", err);
    
    if (onError) {
      onError(`Error rendering TOIL summary: ${String(err)}`);
    }
    
    return <TOILErrorState error={err instanceof Error ? err : String(err)} />;
  }
});

TOILSummaryCard.displayName = 'TOILSummaryCard';

export default memo(TOILSummaryCard);
