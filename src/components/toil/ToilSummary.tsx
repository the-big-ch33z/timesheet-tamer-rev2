
import React from "react";
import { Progress } from "@/components/ui/progress";
import { TOILSummary } from "@/types/toil";
import { formatHours } from "./helpers/toilUtils";

interface ToilSummaryProps {
  summary: TOILSummary | null;
  showRollover?: boolean;
  rolloverHours?: number;
}

export const ToilSummary: React.FC<ToilSummaryProps> = ({ 
  summary, 
  showRollover = false,
  rolloverHours = 0
}) => {
  if (!summary) {
    return (
      <div className="space-y-2 py-4">
        <div className="text-center text-muted-foreground">
          No TOIL data available for this month
        </div>
      </div>
    );
  }

  const totalAccrued = summary.accrued || 0;
  const totalUsed = summary.used || 0;
  const remaining = summary.remaining || 0;
  
  // Calculate percentage for progress bar (cap at 100%)
  const usedPercentage = totalAccrued > 0 
    ? Math.min(Math.round((totalUsed / totalAccrued) * 100), 100)
    : 0;
    
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">TOIL Accrued</span>
          <span>{formatHours(totalAccrued)} hours</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm font-medium">TOIL Used</span>
          <span>{formatHours(totalUsed)} hours</span>
        </div>
        
        <Progress value={usedPercentage} className="h-2" />
        
        <div className="flex justify-between font-semibold pt-2">
          <span>Remaining Balance</span>
          <span 
            className={remaining > 0 ? "text-amber-600" : "text-muted-foreground"}
          >
            {formatHours(remaining)} hours
          </span>
        </div>
      </div>
      
      {showRollover && rolloverHours > 0 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Roll-over TOIL</span>
            <span className="font-semibold text-green-600">{formatHours(rolloverHours)} hours</span>
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            These hours have been rolled over and will be used first when taking TOIL.
          </p>
        </div>
      )}
    </div>
  );
};

export default ToilSummary;
