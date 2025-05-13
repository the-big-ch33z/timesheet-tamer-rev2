
import React from "react";
import { formatDisplayHours } from "@/utils/time/formatting";

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

// Function to check for unexpected props
const checkForUnexpectedProps = (props: Record<string, any>, expectedProps: string[]): string[] => {
  return Object.keys(props).filter(prop => !expectedProps.includes(prop));
};

const TOILSummaryBox: React.FC<TOILSummaryBoxProps> = (props) => {
  const {
    label,
    value,
    color,
    border,
    icon,
    displaySign,
    forceNegative,
    isNegativeBalance,
    showTooltip,
    ...restProps
  } = props;

  // Log all props to see any unexpected ones
  console.log(`TOILSummaryBox - Rendering with props for ${label}:`, { 
    label, 
    value, 
    color, 
    border, 
    icon: !!icon, // Just logging that icon exists to avoid circular references
    displaySign, 
    forceNegative, 
    isNegativeBalance, 
    showTooltip
  });
  
  // Check for any unexpected props
  const expectedPropNames = ['label', 'value', 'color', 'border', 'icon', 'displaySign', 
    'forceNegative', 'isNegativeBalance', 'showTooltip'];
  
  // Find unexpected props (could include data-lov-id)
  const unexpectedProps = checkForUnexpectedProps(restProps, expectedPropNames);
  
  if (unexpectedProps.length > 0) {
    console.warn(`TOILSummaryBox(${label}) - Received unexpected props:`, unexpectedProps);
    console.log('TOILSummaryBox - Full props object:', props);
  }
  
  let formattedValue;
  
  try {
    if (forceNegative) {
      formattedValue = `-${formatDisplayHours(Math.abs(value)).replace(/^[+-]/, '')}`;
    } else if (displaySign) {
      formattedValue = formatDisplayHours(value);
    } else {
      formattedValue = formatDisplayHours(Math.abs(value)).replace(/^[+-]/, '');
    }
    console.log(`TOILSummaryBox(${label}) - Formatted value:`, formattedValue);
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
