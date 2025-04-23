
import React from "react";
import { TimeInputField } from "./TimeInputField";
import { HoursSummary } from "./HoursSummary";
import { TooltipProvider } from "@/components/ui/tooltip";
import BreakInfoFlags from "./BreakInfoFlags";

interface WorkHoursDisplayProps {
  startTime: string;
  endTime: string;
  totalHours: number;
  calculatedHours: number;
  hasEntries: boolean;
  interactive: boolean;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
  isComplete?: boolean;
  hoursVariance?: number;
  isUndertime?: boolean;
  // NEW: flags for breaks included and overrides
  breaksIncluded?: {
    lunch?: boolean;
    smoko?: boolean;
  };
  overrideStates?: {
    lunch?: boolean;
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
  hoursVariance = 0,
  isUndertime = false,
  breaksIncluded,
  overrideStates
}) => {
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    onTimeChange(type, value);
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-3 gap-4 mb-3 items-stretch w-full max-w-full">
        <TimeInputField
          label="Start Time"
          value={startTime}
          type="start"
          interactive={interactive}
          onChange={handleTimeChange}
        />
        <TimeInputField
          label="End Time"
          value={endTime}
          type="end"
          interactive={interactive}
          onChange={handleTimeChange}
        />
        <div className="flex items-stretch w-full flex-col justify-end">
          {/* NEW: Notification flags for included breaks */}
          <BreakInfoFlags breaksIncluded={breaksIncluded} overrideStates={overrideStates} />
          <div className="flex items-stretch w-full justify-end">
            <HoursSummary
              totalHours={totalHours}
              calculatedHours={calculatedHours}
              hasEntries={hasEntries}
              hasTime={!!(startTime && endTime)}
              isComplete={isComplete}
              hoursVariance={hoursVariance}
              isUndertime={isUndertime}
              // Optionally add notification to the summary in the future
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WorkHoursDisplay;
