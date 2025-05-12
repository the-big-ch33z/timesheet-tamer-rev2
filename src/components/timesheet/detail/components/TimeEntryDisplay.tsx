
import React, { useState, useEffect } from "react";
import { calculateHoursFromTimes } from "@/utils/time/calculations/timeCalculations";
import { Clock } from "lucide-react";
import { format } from "date-fns";

interface TimeEntryDisplayProps {
  startTime: string;
  endTime: string;
  calculatedHours: number;
  totalHours: number; 
  hasEntries: boolean;
  interactive: boolean;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
}

const TimeEntryDisplay: React.FC<TimeEntryDisplayProps> = ({
  startTime,
  endTime,
  calculatedHours,
  totalHours,
  hasEntries,
  interactive,
  onTimeChange
}) => {
  // Use empty strings if no time values are provided
  const [localStartTime, setLocalStartTime] = useState(startTime || "");
  const [localEndTime, setLocalEndTime] = useState(endTime || "");

  // Update local state when props change
  useEffect(() => {
    setLocalStartTime(startTime || "");
    setLocalEndTime(endTime || "");
  }, [startTime, endTime]);

  // Handle local time changes
  const handleTimeInputChange = (type: 'start' | 'end', value: string) => {
    if (!interactive) return;

    if (type === 'start') {
      setLocalStartTime(value);
      // Debounce the propagation to parent
      const timer = setTimeout(() => onTimeChange('start', value), 300);
      return () => clearTimeout(timer);
    } else {
      setLocalEndTime(value);
      // Debounce the propagation to parent
      const timer = setTimeout(() => onTimeChange('end', value), 300);
      return () => clearTimeout(timer);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-3">
      <div>
        <div className="text-sm text-amber-700 mb-1">Start Time</div>
        <div className={`${interactive ? 'bg-white' : 'bg-white'} border border-amber-200 rounded-md p-2 flex items-center`}>
          {interactive ? (
            <input
              type="time"
              value={localStartTime}
              onChange={(e) => handleTimeInputChange('start', e.target.value)}
              className="text-lg bg-transparent w-full outline-none"
              data-testid="start-time-input"
            />
          ) : (
            <span className="text-lg">
              {localStartTime ? format(new Date(`2000-01-01T${localStartTime}`), "h:mm a") : "--:--"}
            </span>
          )}
          <Clock className="h-4 w-4 ml-2 text-gray-400" />
        </div>
      </div>
      
      <div>
        <div className="text-sm text-amber-700 mb-1">End Time</div>
        <div className={`${interactive ? 'bg-white' : 'bg-white'} border border-amber-200 rounded-md p-2 flex items-center`}>
          {interactive ? (
            <input
              type="time"
              value={localEndTime}
              onChange={(e) => handleTimeInputChange('end', e.target.value)}
              className="text-lg bg-transparent w-full outline-none"
              data-testid="end-time-input"
            />
          ) : (
            <span className="text-lg">
              {localEndTime ? format(new Date(`2000-01-01T${localEndTime}`), "h:mm a") : "--:--"}
            </span>
          )}
          <Clock className="h-4 w-4 ml-2 text-gray-400" />
        </div>
      </div>
      
      <div>
        <div className="text-sm text-amber-700 mb-1">Total Hours</div>
        <div className={`bg-white border ${hasEntries ? 'border-amber-200' : 'border-gray-200'} rounded-md p-2`}>
          <span className={`text-lg ${!hasEntries && 'text-gray-400'}`}>
            {hasEntries ? totalHours.toFixed(1) : calculatedHours.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeEntryDisplay;
