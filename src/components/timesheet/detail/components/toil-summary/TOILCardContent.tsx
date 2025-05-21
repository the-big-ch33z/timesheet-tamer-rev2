
import React, { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createTimeLogger } from "@/utils/time/errors";
import { TOILSummary as TOILSummaryType } from "@/types/toil";
import TOILSummary from "@/components/toil/TOILSummary";
import TOILSummaryBoxes from "./TOILSummaryBoxes";

// Create logger
const logger = createTimeLogger('TOILCardContent');

interface TOILCardContentProps {
  summary: TOILSummaryType | null;
  loading: boolean;
  showRollover?: boolean;
  rolloverHours?: number;
  useSimpleView?: boolean;
  onError?: (error: string) => void;
}

/**
 * Separated card content component to handle loading states and rendering
 */
const TOILCardContent: React.FC<TOILCardContentProps> = ({
  summary,
  loading,
  showRollover = false,
  rolloverHours = 0,
  useSimpleView = false,
  onError
}) => {
  // Log state changes
  React.useEffect(() => {
    logger.debug(`TOILCardContent state: loading=${loading}, hasSummary=${!!summary}`);
    if (summary) {
      logger.debug(`TOIL Summary: accrued=${summary.accrued}, used=${summary.used}, remaining=${summary.remaining}`);
    }
  }, [summary, loading]);

  // If loading, show skeletons
  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="flex justify-between mt-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
    );
  }

  try {
    // Use TOILSummaryBoxes for detailed view, and shared TOILSummary component for simple view
    if (!useSimpleView && summary) {
      return (
        <TOILSummaryBoxes
          accrued={summary.accrued}
          used={summary.used}
          remaining={summary.remaining}
          onError={onError}
        />
      );
    }
    
    // Use the shared TOIL summary component for simple view
    return (
      <TOILSummary 
        summary={summary}
        showRollover={showRollover}
        rolloverHours={rolloverHours}
        variant={useSimpleView ? "simple" : "detailed"}
      />
    );
  } catch (error) {
    logger.error('Error rendering TOILCardContent:', error);
    if (onError) {
      onError(`Error rendering TOIL summary: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Fallback to error display
    return (
      <div className="text-center p-4 text-red-500">
        <p>Could not display TOIL summary</p>
        <p className="text-xs mt-2">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
};

export default memo(TOILCardContent);
