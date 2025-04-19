
import React from "react";
import { TimeInputField } from "./TimeInputField";
import { HoursSummary } from "./HoursSummary";
import { TooltipProvider } from "@/components/ui/tooltip";

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
  // Handle time changes directly without local state
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    console.log(`WorkHoursDisplay: Time changed: ${type} = ${value}`);
    onTimeChange(type, value);
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-3 gap-4 mb-3">
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
        
        <HoursSummary
          totalHours={totalHours}
          calculatedHours={calculatedHours}
          hasEntries={hasEntries}
          hasTime={!!(startTime && endTime)}
          isComplete={isComplete}
        />
      </div>
    </TooltipProvider>
  );
};

export default WorkHoursDisplay;
