
import React, { useCallback, useEffect } from "react";
import { TimeInputField } from "./TimeInputField";
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

// Helper to normalize time format
const normalizeTime = (time: string): string => {
  if (!time) return "";
  
  // Already in HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Convert single numbers to HH:00 format
  if (/^\d{1,2}$/.test(time)) {
    return `${time.padStart(2, '0')}:00`;
  }
  
  return time;
};

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

  // Log when times change for debugging
  useEffect(() => {
    console.debug(`[TimeDisplay] Times updated - start: '${startTime}', end: '${endTime}'`);
  }, [startTime, endTime]);

  // Handle time changes from child components with improved error handling
  const handleTimeChange = useCallback((type: 'start' | 'end') => (value: string) => {
    console.debug(`[TimeDisplay] Time changed: ${type} = '${value}', interactive=${interactive}`);
    
    if (!interactive) {
      console.debug("[TimeDisplay] Not interactive, ignoring time change");
      return;
    }
    
    // Normalize time before passing up
    const normalizedValue = normalizeTime(value);
    
    // Directly call the parent handler
    onTimeChange(type, normalizedValue);
  }, [onTimeChange, interactive]);

  // Determine if we should show a message about entering times
  const showEnterTimesMessage = !startTime || !endTime;
  const hasNoCalculatedHours = !calculatedHours || calculatedHours === 0;

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-3">
        <TimeInputField
          label="Start Time"
          value={normalizeTime(startTime)}
          onChange={handleTimeChange('start')}
          interactive={interactive}
          testId="start-time-input"
          placeholder="Enter start time"
        />
        
        <TimeInputField
          label="End Time"
          value={normalizeTime(endTime)}
          onChange={handleTimeChange('end')}
          interactive={interactive}
          testId="end-time-input"
          placeholder="Enter end time"
        />
        
        <div>
          <div className="text-sm text-amber-700 mb-1">Total Hours</div>
          <div className={`bg-white border ${hasEntries ? 'border-amber-200' : 'border-gray-200'} rounded-md p-2`}>
            {showEnterTimesMessage && interactive ? (
              <span className="text-sm text-gray-500">Enter start/end times</span>
            ) : (
              <span className={`text-lg ${!hasEntries && hasNoCalculatedHours && 'text-gray-400'}`}>
                {hasEntries ? formatDisplayHours(totalHours) : formatDisplayHours(calculatedHours)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {showEnterTimesMessage && interactive && (
        <div className="mb-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
          Please enter both start and end times to calculate work hours
        </div>
      )}
    </>
  );
};

export default TimeDisplay;
