
import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Check, Info } from "lucide-react";

interface HoursSummaryProps {
  totalHours: number;
  calculatedHours: number;
  hasEntries: boolean;
  hasTime: boolean;
  isComplete?: boolean;
  hoursVariance?: number;
  isUndertime?: boolean;
}

const getStatusDisplay = (
  isComplete: boolean | undefined,
  isUndertime: boolean | undefined,
  hoursVariance: number | undefined,
  hasEntries: boolean
) => {
  if (!hasEntries) {
    return {
      text: "No entries",
      icon: <Info className="w-4 h-4 mr-1 text-gray-400" />,
      color: "text-gray-400"
    };
  }

  if (isComplete) {
    return {
      text: "Complete",
      icon: <Check className="w-4 h-4 mr-1 text-green-500" />,
      color: "text-green-700"
    };
  }

  // Round variance to nearest 0.25
  const roundedVariance = Math.round(Math.abs(hoursVariance || 0) * 4) / 4;

  if (isUndertime && typeof hoursVariance === "number") {
    return {
      text: `${roundedVariance.toFixed(2)} hours under`,
      icon: <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />,
      color: "text-amber-700"
    };
  }

  if (typeof hoursVariance === "number" && hoursVariance > 0.01) {
    return {
      text: `${roundedVariance.toFixed(2)} hours over`,
      icon: <Info className="w-4 h-4 mr-1 text-blue-500" />,
      color: "text-blue-700"
    };
  }

  return { text: "", icon: null, color: "" };
};

/**
 * HOURS SUMMARY: Now also shows overall progress, entered/scheduled fraction, and status
 * Updated with better quarter-hour rounding
 */
export const HoursSummary: React.FC<HoursSummaryProps> = ({
  totalHours,
  calculatedHours,
  hasEntries,
  hasTime,
  isComplete,
  hoursVariance = 0,
  isUndertime = false
}) => {
  // Round totalHours and calculatedHours to nearest quarter hour for display
  const roundedTotal = Math.round(totalHours * 4) / 4;
  const roundedCalculated = Math.round(calculatedHours * 4) / 4;
  
  const percent =
    roundedCalculated > 0
      ? Math.min(100, Math.round((roundedTotal / roundedCalculated) * 100))
      : 0;

  const status = getStatusDisplay(isComplete, isUndertime, hoursVariance, hasEntries);

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-row items-center gap-4 min-w-[220px]">
        <div className={cn(
          "flex flex-col flex-grow items-start"
        )}>
          <div className="text-xs text-amber-700 font-semibold mb-1">Hours Summary</div>
          <div className={cn(
            "text-lg flex items-center font-bold",
            isComplete ? "text-green-600" : !hasEntries && "text-gray-400"
          )}>
            {roundedTotal.toFixed(2)}
            <span className="mx-1 text-gray-400 font-normal text-base">/</span>
            <span className="text-gray-500 font-semibold">{roundedCalculated.toFixed(2)}</span>
            <span className="ml-2 text-xs text-gray-500 font-normal">hours</span>
          </div>
          <div className={"mt-1 flex items-center text-xs " + status.color}>
            {status.icon}
            {status.text}
          </div>
        </div>
        <div className="flex items-center h-full">
          <div className="flex flex-col justify-center h-full">
            <Progress
              value={percent}
              color={isComplete ? "success" : isUndertime ? "warning" : "default"}
              className={`w-2 h-14 bg-blue-100 rounded-full mx-2`}
              indicatorColor={
                isComplete
                  ? "bg-green-500"
                  : isUndertime
                    ? "bg-amber-500"
                    : "bg-blue-500"
              }
              style={{ writingMode: "vertical-lr", rotate: "180deg" }}
            />
            <div className="text-[10px] mt-1 mx-auto text-gray-500 text-center font-medium">{percent}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
