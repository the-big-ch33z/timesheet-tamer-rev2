
import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HoursSummaryProps {
  totalHours: number;
  calculatedHours: number;
  hasEntries: boolean;
  hasTime: boolean;
  isComplete?: boolean;
}

export const HoursSummary: React.FC<HoursSummaryProps> = ({
  totalHours,
  calculatedHours,
  hasEntries,
  hasTime,
  isComplete
}) => {
  return (
    <div>
      <div className="text-sm text-amber-700 mb-1">Hours Summary</div>
      <div className={cn(
        "bg-white border rounded-md p-2",
        isComplete ? "border-green-500" : hasEntries ? "border-amber-200" : "border-gray-200"
      )}>
        {!hasTime ? (
          <span className="text-sm text-gray-500">Enter start/end times</span>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1">
                <div className={cn(
                  "text-lg",
                  isComplete ? "text-green-600 font-medium" : !hasEntries && "text-gray-400"
                )}>
                  {totalHours.toFixed(1)} / {calculatedHours.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  {hasEntries ? "Entered / Scheduled" : "Scheduled Hours"}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {totalHours.toFixed(1)} hours entered out of {calculatedHours.toFixed(1)} scheduled hours
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
