
import React, { useEffect } from "react";
import { Bell, Coffee } from "lucide-react";
import TimeInput from "@/components/ui/time-input/TimeInput";

// Helper to round to nearest 0.25 for summary display
function roundToQuarter(value: number) {
  return Math.round(value * 4) / 4;
}

interface WorkHoursDisplayProps {
  startTime: string;
  endTime: string;
  totalHours: number;
  calculatedHours: number;
  hasEntries: boolean;
  interactive: boolean;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
  isComplete: boolean;
  hoursVariance: number;
  isUndertime: boolean;
  breaksIncluded: {
    lunch: boolean;
    smoko: boolean;
  };
  overrideStates: {
    lunch: boolean;
  };
}

const WorkHoursDisplay: React.FC<WorkHoursDisplayProps> = ({
  startTime,
  endTime,
  totalHours,
  calculatedHours,
  hasEntries,
  interactive,
  onTimeChange,
  isComplete,
  hoursVariance,
  isUndertime,
  breaksIncluded,
  overrideStates
}) => {
  // Ensure we display actual hours / target hours for clarity
  const displayTotalHours = totalHours;
  const displayCalculatedHours = calculatedHours;

  // For debugging
  useEffect(() => {
    console.debug('[WorkHoursDisplay] Received props:', { 
      startTime, 
      endTime, 
      totalHours, 
      calculatedHours, 
      interactive 
    });
  }, [startTime, endTime, totalHours, calculatedHours, interactive]);

  return (
    <div className="w-full p-4 bg-white border-t border-gray-200 rounded-b-md">
      <div className="flex items-center justify-start gap-6 mb-2">
        <div className="flex flex-col">
          <TimeInput 
            id="start-time"
            label="Start Time"
            value={startTime}
            onChange={(value) => onTimeChange("start", value)} 
            disabled={!interactive}
            className="w-32"
            placeholder="e.g. 8:30am"
          />
        </div>

        <div className="flex flex-col">
          <TimeInput 
            id="end-time"
            label="End Time"
            value={endTime}
            onChange={(value) => onTimeChange("end", value)}
            disabled={!interactive}
            className="w-32"
            placeholder="e.g. 5:00pm"
          />
        </div>

        {/* Hours summary, proper display of entered/target hours */}
        <div className="flex flex-col justify-center">
          <div className="text-xs text-gray-500">Hours Summary</div>
          <div className="text-sm font-semibold text-gray-800">
            {displayTotalHours.toFixed(2)} / {displayCalculatedHours.toFixed(2)} hours
          </div>
        </div>

        {/* Break chips - only show when they're actually being subtracted */}
        <div className="flex items-center gap-2 ml-4">
          {breaksIncluded.lunch && (
            <span className="flex items-center px-[0.5em] py-[0.15em] rounded-full bg-lime-50 border border-lime-200 text-lime-700 text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Lunch subtracted
            </span>
          )}
          {overrideStates.lunch && (
            <span className="flex items-center px-[0.5em] py-[0.15em] rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Lunch override
            </span>
          )}
          {breaksIncluded.smoko && (
            <span className="flex items-center px-[0.5em] py-[0.15em] rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs">
              <Coffee className="h-3 w-3 mr-1" />
              Smoko subtracted
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(WorkHoursDisplay);
