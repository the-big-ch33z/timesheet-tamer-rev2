
import React from "react";
import { Progress } from "@/components/ui/progress";
import { formatDisplayHours } from "@/utils/time/formatting";

interface TOILProgressBarProps {
  remaining: number;
  accrued: number;
  isNegativeBalance: boolean;
}

const TOILProgressBar: React.FC<TOILProgressBarProps> = ({ remaining, accrued, isNegativeBalance }) => {
  // Ensure we have valid numbers
  const safeRemaining = isFinite(remaining) ? remaining : 0;
  const safeAccrued = isFinite(accrued) ? accrued : 0;
  
  const total = Math.max(safeAccrued + Math.abs(safeRemaining), 1); // Prevent division by zero
  const progressValue = total === 0 
    ? 0 
    : Math.max(0, Math.min(100, 100 * Math.abs(safeRemaining) / (safeAccrued || 1)));
  
  return (
    <>
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-600 px-2">
        <span>Balance</span>
        <span className={`font-bold tracking-tight ${isNegativeBalance ? "text-[#ea384c]" : ""}`}>
          {isNegativeBalance ? "-" : "+"}{formatDisplayHours(Math.abs(safeRemaining)).replace(/^[+-]/, '')}
        </span>
      </div>
      <Progress 
        value={progressValue} 
        className={`h-2 ${isNegativeBalance ? "bg-red-100/60" : "bg-green-100/60"}`}
      />
    </>
  );
};

export default TOILProgressBar;
