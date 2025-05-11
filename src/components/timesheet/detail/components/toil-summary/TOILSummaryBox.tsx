
import React, { useEffect } from "react";
import { formatDisplayHours } from "@/utils/time/formatting";
import { CircleMinus, CirclePlus, CircleCheck, AlertTriangle } from "lucide-react";

interface TOILSummaryBoxProps {
  label: string;
  value: number;
  color: string;
  border: string;
  icon: React.ReactNode;
  displaySign: boolean;
  forceNegative?: boolean;
  isNegativeBalance?: boolean;
  showTooltip?: boolean;
}

const TOILSummaryBox: React.FC<TOILSummaryBoxProps> = ({
  label,
  value,
  color,
  border,
  icon,
  displaySign,
  forceNegative,
  isNegativeBalance,
  showTooltip
}) => {
  let formattedValue;
  
  try {
    if (forceNegative) {
      formattedValue = `-${formatDisplayHours(Math.abs(value)).replace(/^[+-]/, '')}`;
    } else if (displaySign) {
      formattedValue = formatDisplayHours(value);
    } else {
      formattedValue = formatDisplayHours(Math.abs(value)).replace(/^[+-]/, '');
    }
  } catch (e) {
    console.error(`Error formatting value for ${label}`, e);
    formattedValue = "0h";
  }
  
  return (
    <div 
      className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border ${border} bg-white/80 shadow-sm 
        transition-transform hover:scale-102 md:hover:scale-105`}
    >
      {icon}
      <span className={`text-[0.95rem] font-semibold tracking-tight ${color}`}>{label}</span>
      <span className={`text-2xl font-extrabold leading-none ${color}`}>
        {formattedValue}
      </span>
      <span className="text-xs text-gray-500 font-medium">hours</span>

      {label === "Earned" && showTooltip && (
        <div className="text-xs text-gray-500 mt-1 cursor-help">
          Click for details
        </div>
      )}

      {label === "Remaining" && isNegativeBalance && (
        <div className="mt-1 text-xs text-[#ea384c] font-medium animate-pulse">
          Negative balance
        </div>
      )}
    </div>
  );
};

export default TOILSummaryBox;
