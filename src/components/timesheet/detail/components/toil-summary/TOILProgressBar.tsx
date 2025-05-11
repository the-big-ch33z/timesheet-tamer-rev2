
import React from "react";
import { Progress } from "@/components/ui/progress";
import { formatDisplayHours } from "@/utils/time/formatting";

interface TOILProgressBarProps {
  remaining: number;
  accrued: number;
  isNegativeBalance: boolean;
}

const TOILProgressBar: React.FC<TOILProgressBarProps> = ({ remaining, accrued, isNegativeBalance }) => {
  const total = Math.max(accrued + Math.abs(remaining), 1); // Prevent division by zero
  const progressColor = isNegativeBalance ? "bg-[#ea384c]" : "bg-green-500";
  const progressBgColor = isNegativeBalance ? "bg-red-100/60" : "bg-green-100/60";
  
  const progressValue = total === 0 
    ? 0 
    : Math.max(0, Math.min(100, 100 * Math.abs(remaining) / (accrued || 1)));
  
  return (
    <>
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-600 px-2">
        <span>Balance</span>
        <span className={`font-bold tracking-tight ${isNegativeBalance ? "text-[#ea384c]" : ""}`}>
          {isNegativeBalance ? "-" : "+"}{formatDisplayHours(Math.abs(remaining)).replace(/^[+-]/, '')}
        </span>
      </div>
      <Progress 
        value={progressValue} 
        color={isNegativeBalance ? "destructive" : "success"} 
        className={`h-2 ${progressBgColor}`} 
        indicatorColor={progressColor} 
      />
    </>
  );
};

export default TOILProgressBar;
