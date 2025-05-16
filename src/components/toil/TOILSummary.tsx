
import React from "react";
import { Progress } from "@/components/ui/progress";
import { TOILSummary as TOILSummaryType } from "@/types/toil";
import { formatDisplayHours } from "@/utils/time/formatting";

interface TOILSummaryProps {
  summary: TOILSummaryType | null;
  showRollover?: boolean;
  rolloverHours?: number;
  variant?: "simple" | "detailed";
}

/**
 * Unified TOIL Summary component that can be used in both card and inline contexts
 * @param summary - TOIL summary object
 * @param showRollover - Whether to show rollover hours section
 * @param rolloverHours - Number of rollover hours
 * @param variant - Visual style variant ("simple" or "detailed")
 */
export const TOILSummary: React.FC<TOILSummaryProps> = ({ 
  summary, 
  showRollover = false,
  rolloverHours = 0,
  variant = "simple"
}) => {
  // Always show a summary with default values of zero if no summary is provided
  const totalAccrued = summary?.accrued || 0;
  const totalUsed = summary?.used || 0;
  const remaining = summary?.remaining || 0;
  
  // Calculate percentage for progress bar (cap at 100%)
  const usedPercentage = totalAccrued > 0 
    ? Math.min(Math.round((totalUsed / totalAccrued) * 100), 100)
    : 0;
    
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">TOIL Accrued</span>
          <span>{formatDisplayHours(totalAccrued).replace(/^[+-]/, '')}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm font-medium">TOIL Used</span>
          <span>{formatDisplayHours(totalUsed).replace(/^[+-]/, '')}</span>
        </div>
        
        <Progress value={usedPercentage} className="h-2" />
        
        <div className="flex justify-between font-semibold pt-2">
          <span>Remaining Balance</span>
          <span 
            className={remaining > 0 ? "text-amber-600" : "text-muted-foreground"}
          >
            {formatDisplayHours(remaining).replace(/^[+-]/, '')}
          </span>
        </div>
      </div>
      
      {showRollover && rolloverHours > 0 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Roll-over TOIL</span>
            <span className="font-semibold text-green-600">{formatDisplayHours(rolloverHours).replace(/^[+-]/, '')}</span>
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            These hours have been rolled over and will be used first when taking TOIL.
          </p>
        </div>
      )}
    </div>
  );
};

export default TOILSummary;
