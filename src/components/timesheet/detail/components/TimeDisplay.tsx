
import React, { useCallback, useEffect } from "react";
import TimeInputField from "./TimeInputField";
import { formatDisplayHours } from "@/utils/time/formatting/timeFormatting";

interface TimeDisplayProps {
  startTime: string;
  endTime: string;
  calculatedHours: number;
  totalHours: number;
  hasEntries: boolean;
  interactive: boolean;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  startTime,
  endTime,
  calculatedHours,
  totalHours,
  hasEntries,
  interactive,
  onTimeChange
}) => {
  // Track when interactive flag changes
  useEffect(() => {
    console.debug(`[TimeDisplay] Interactive flag changed to: ${interactive}`);
  }, [interactive]);

  // Handle time changes from child components with improved error handling
  const handleTimeChange = useCallback((type: 'start' | 'end') => (value: string) => {
    console.debug(`[TimeDisplay] Time changed: ${type} = ${value}, interactive=${interactive}`);
    
    if (!interactive) {
      console.debug("[TimeDisplay] Not interactive, ignoring time change");
      return;
    }
    
    if (!value) {
      console.warn(`[TimeDisplay] Empty ${type} time value received, using default`);
      return;
    }
    
    // Directly call the parent handler to avoid delays
    onTimeChange(type, value);
  }, [onTimeChange, interactive]);

  return (
    <div className="grid grid-cols-3 gap-4 mb-3">
      <TimeInputField
        label="Start Time"
        value={startTime}
        onChange={handleTimeChange('start')}
        interactive={interactive}
        testId="start-time-input"
      />
      
      <TimeInputField
        label="End Time"
        value={endTime}
        onChange={handleTimeChange('end')}
        interactive={interactive}
        testId="end-time-input"
      />
      
      <div>
        <div className="text-sm text-amber-700 mb-1">Total Hours</div>
        <div className={`bg-white border ${hasEntries ? 'border-amber-200' : 'border-gray-200'} rounded-md p-2`}>
          <span className={`text-lg ${!hasEntries && 'text-gray-400'}`}>
            {hasEntries ? formatDisplayHours(totalHours) : formatDisplayHours(calculatedHours)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeDisplay;
