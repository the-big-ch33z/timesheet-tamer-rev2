
import React, { useCallback, useEffect } from "react";
import { TimeInputField } from "./TimeInputField";

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
  return (
    <div className="grid grid-cols-2 gap-4">
      <TimeInputField
        label="Start Time"
        value={startTime}
        type="start"
        interactive={interactive}
        onChange={onTimeChange}
        testId="start-time-input"
        placeholder="e.g. 08:30"
      />
      
      <TimeInputField
        label="End Time"
        value={endTime}
        type="end"
        interactive={interactive}
        onChange={onTimeChange}
        testId="end-time-input"
        placeholder="e.g. 17:00"
      />
      
      <div className="col-span-2 mt-2">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">
            Hours: <span className="text-amber-700">{hasEntries ? totalHours.toFixed(1) : calculatedHours.toFixed(1)}</span>
          </div>
          
          {hasEntries && totalHours !== calculatedHours && (
            <div className="text-xs text-gray-500">
              {totalHours > calculatedHours ? "Overtime" : "Undertime"}: 
              {Math.abs(totalHours - calculatedHours).toFixed(1)} hrs
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeDisplay;
