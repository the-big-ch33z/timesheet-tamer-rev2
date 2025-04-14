
import React from "react";
import TimeHeaderSection from "./TimeHeaderSection";
import WorkHoursAlerts from "./WorkHoursAlerts";

interface TimeHeaderProps {
  date: Date;
  startTime: string;
  endTime: string;
  calculatedHours: number;
  totalHours: number;
  hasEntries: boolean;
  hoursVariance: number;
  isUndertime: boolean;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
  interactive: boolean;
}

const TimeHeader: React.FC<TimeHeaderProps> = ({
  date,
  startTime,
  endTime,
  calculatedHours,
  totalHours,
  hasEntries,
  hoursVariance,
  isUndertime,
  onTimeChange,
  interactive
}) => {
  return (
    <div className="mb-6">
      <TimeHeaderSection
        hasEntries={hasEntries}
        startTime={startTime}
        endTime={endTime}
        calculatedHours={calculatedHours}
        totalHours={totalHours}
        interactive={interactive}
        onTimeChange={onTimeChange}
      />
      
      {/* Show alerts if there are entries */}
      {hasEntries && (
        <WorkHoursAlerts
          hoursVariance={hoursVariance}
          isUndertime={isUndertime}
          date={date}
        />
      )}
    </div>
  );
};

export default TimeHeader;
