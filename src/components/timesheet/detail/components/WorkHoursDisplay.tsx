
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WorkHoursDisplayProps {
  startTime: string;
  endTime: string;
  totalHours: number;
  calculatedHours: number;
  hasEntries: boolean;
  interactive: boolean;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
  isComplete?: boolean;
}

const WorkHoursDisplay: React.FC<WorkHoursDisplayProps> = ({
  startTime,
  endTime,
  totalHours,
  calculatedHours,
  hasEntries,
  interactive,
  onTimeChange,
  isComplete
}) => {
  // Local state to show immediate feedback
  const [localStartTime, setLocalStartTime] = useState(startTime);
  const [localEndTime, setLocalEndTime] = useState(endTime);

  // Update local state when props change
  useEffect(() => {
    setLocalStartTime(startTime);
  }, [startTime]);

  useEffect(() => {
    setLocalEndTime(endTime);
  }, [endTime]);

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    console.log(`WorkHoursDisplay: Time changed: ${type} = ${value}`);
    
    // Update local state for immediate UI feedback
    if (type === 'start') {
      setLocalStartTime(value);
    } else {
      setLocalEndTime(value);
    }
    
    // Also update parent component
    onTimeChange(type, value);
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
              onChange={(e) => handleTimeChange('start', e.target.value)}
              className="text-lg bg-transparent w-full outline-none"
              placeholder="Enter start time"
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
              onChange={(e) => handleTimeChange('end', e.target.value)}
              className="text-lg bg-transparent w-full outline-none"
              placeholder="Enter end time"
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
        <div className={cn(
          "bg-white border rounded-md p-2",
          isComplete ? "border-green-500" : hasEntries ? "border-amber-200" : "border-gray-200"
        )}>
          {!localStartTime || !localEndTime ? (
            <span className="text-sm text-gray-500">Enter start/end times</span>
          ) : (
            <span className={cn(
              "text-lg",
              isComplete ? "text-green-600 font-medium" : !hasEntries && "text-gray-400"
            )}>
              {hasEntries ? totalHours.toFixed(1) : calculatedHours.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkHoursDisplay;
