
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
  // Default values for missing props
  const emptyBreakConfig = { lunch: false, smoko: false };
  const emptyActionStates = { lunch: false, smoko: false };
  
  // Dummy onToggleAction function as it's not used in this context
  const handleToggleAction = (action: string) => {
    console.log(`Toggle action ${action} not implemented in TimeHeader`);
  };

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
      
      {/* Show alerts if there are entries or display the no-entries message */}
      <WorkHoursAlerts
        hasEntries={hasEntries}
        isUndertime={isUndertime}
        hoursVariance={hoursVariance}
        interactive={interactive}
        date={date}
        isComplete={false}
        effectiveHours={totalHours}
        scheduledHours={calculatedHours}
        breakConfig={emptyBreakConfig}
        displayBreakConfig={emptyBreakConfig}
        actionStates={emptyActionStates}
        onToggleAction={handleToggleAction}
        isOverScheduled={false}
      />
    </div>
  );
};

export default TimeHeader;
