
import React from "react";
import WorkHoursHeader from "./WorkHoursHeader";
import TimeDisplay from "./TimeDisplay";
import { formatDisplayHours } from "@/utils/time/formatting";

interface TimeHeaderSectionProps {
  hasEntries: boolean;
  startTime: string;
  endTime: string;
  calculatedHours: number;
  totalHours: number;
  interactive: boolean;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
}

const TimeHeaderSection: React.FC<TimeHeaderSectionProps> = ({
  hasEntries,
  startTime,
  endTime,
  calculatedHours,
  totalHours,
  interactive,
  onTimeChange
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <WorkHoursHeader hasEntries={hasEntries} />
      </div>
      
      <TimeDisplay
        startTime={startTime}
        endTime={endTime}
        calculatedHours={calculatedHours}
        totalHours={totalHours}
        hasEntries={hasEntries}
        interactive={interactive}
        onTimeChange={onTimeChange}
      />
      
      <div className="flex justify-end mt-2">
        <div className="text-right">
          <div className="text-sm text-amber-700">Daily Target:</div>
          <div className="text-xl font-semibold text-amber-900">{formatDisplayHours(calculatedHours)}</div>
        </div>
      </div>
    </>
  );
};

export default TimeHeaderSection;
