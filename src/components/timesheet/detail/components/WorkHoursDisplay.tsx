
import React from "react";
import { Input } from "@/components/ui/input";
import { Bell, Coffee } from "lucide-react";

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
  return (
    <div className="w-full p-4 bg-white border-t border-gray-200 rounded-b-md">
      <div className="flex items-center justify-start gap-6 mb-2">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Start Time</label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => onTimeChange("start", e.target.value)}
            disabled={!interactive}
            className="w-32"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600">End Time</label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => onTimeChange("end", e.target.value)}
            disabled={!interactive}
            className="w-32"
          />
        </div>

        {/* Scheduled hours summary, now rounded to 0.25 */}
        <div className="flex flex-col justify-center">
          <div className="text-xs text-gray-500">Hours Summary</div>
          <div className="text-sm font-semibold text-gray-800">
            {roundToQuarter(totalHours).toFixed(2)} / {roundToQuarter(calculatedHours).toFixed(2)} hours
          </div>
        </div>

        {/* Break chips */}
        <div className="flex items-center gap-2 ml-4">
          {breaksIncluded.lunch && (
            <span className="flex items-center px-[0.5em] py-[0.15em] rounded-full bg-lime-50 border border-lime-200 text-lime-700 text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Lunch subtracted
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

