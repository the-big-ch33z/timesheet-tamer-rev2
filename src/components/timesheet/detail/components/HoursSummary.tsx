
import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

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
  // Always show only scheduled hours now and visually emphasize completion
  const percent = calculatedHours > 0 ? Math.min(100, Math.round((totalHours / calculatedHours) * 100)) : 0;
  const isDone = isComplete && calculatedHours > 0;

  return (
    <div>
      <div className="text-sm text-amber-700 mb-1">Hours Summary</div>
      <div className={cn(
        "bg-white border rounded-md p-2",
        isDone ? "border-green-500" : hasEntries ? "border-amber-200" : "border-gray-200"
      )}>
        <div className="flex flex-col gap-1">
          {/* Progress Bar always above */}
          <Progress
            value={percent}
            color={isDone ? "success" : "default"}
            className={`mb-2 h-2 ${isDone ? "bg-green-100" : "bg-blue-100"}`}
            indicatorColor={isDone ? "bg-green-500" : "bg-blue-500"}
          />
          {/* Only show scheduled hours — always scheduled/target */}
          <div className={cn(
            "text-lg",
            isDone ? "text-green-600 font-medium" : !hasEntries && "text-gray-400"
          )}>
            {calculatedHours.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">
            Scheduled Hours
          </div>
        </div>
      </div>
    </div>
  );
};
