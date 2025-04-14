
import React from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";

interface WorkHoursDisplayProps {
  startTime: string;
  endTime: string;
  totalHours: number;
  calculatedHours: number;
  hasEntries: boolean;
  interactive: boolean;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
}

const WorkHoursDisplay: React.FC<WorkHoursDisplayProps> = ({
  startTime,
  endTime,
  totalHours,
  calculatedHours,
  hasEntries,
  interactive,
  onTimeChange
}) => {
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    console.log(`WorkHoursDisplay: Time changed: ${type} = ${value}`);
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
              value={startTime}
              onChange={(e) => handleTimeChange('start', e.target.value)}
              className="text-lg bg-transparent w-full outline-none"
              placeholder="Enter start time"
            />
          ) : (
            <span className="text-lg">
              {startTime ? format(new Date(`2000-01-01T${startTime}`), "h:mm a") : "--:--"}
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
              value={endTime}
              onChange={(e) => handleTimeChange('end', e.target.value)}
              className="text-lg bg-transparent w-full outline-none"
              placeholder="Enter end time"
            />
          ) : (
            <span className="text-lg">
              {endTime ? format(new Date(`2000-01-01T${endTime}`), "h:mm a") : "--:--"}
            </span>
          )}
          <Clock className="h-4 w-4 ml-2 text-gray-400" />
        </div>
      </div>
      
      <div>
        <div className="text-sm text-amber-700 mb-1">Total Hours</div>
        <div className={`bg-white border ${hasEntries ? 'border-amber-200' : 'border-gray-200'} rounded-md p-2`}>
          {!startTime || !endTime ? (
            <span className="text-sm text-gray-500">Enter start/end times</span>
          ) : (
            <span className={`text-lg ${!hasEntries && 'text-gray-400'}`}>
              {hasEntries ? totalHours.toFixed(1) : calculatedHours.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkHoursDisplay;
