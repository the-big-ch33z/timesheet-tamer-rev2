
import React, { memo } from "react";
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
          {/* Notification flags for included breaks */}
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
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Use custom equality check for memoization
function workHoursDisplayPropsAreEqual(prevProps: WorkHoursDisplayProps, nextProps: WorkHoursDisplayProps) {
  // Check basic equality for primitive props
  if (
    prevProps.startTime !== nextProps.startTime ||
    prevProps.endTime !== nextProps.endTime ||
    prevProps.totalHours !== nextProps.totalHours ||
    prevProps.calculatedHours !== nextProps.calculatedHours ||
    prevProps.hasEntries !== nextProps.hasEntries ||
    prevProps.interactive !== nextProps.interactive ||
    prevProps.isComplete !== nextProps.isComplete ||
    prevProps.hoursVariance !== nextProps.hoursVariance ||
    prevProps.isUndertime !== nextProps.isUndertime
  ) {
    return false;
  }
  
  // Deep check for breaksIncluded
  const prevBreaks = prevProps.breaksIncluded || {};
  const nextBreaks = nextProps.breaksIncluded || {};
  if (prevBreaks.lunch !== nextBreaks.lunch || prevBreaks.smoko !== nextBreaks.smoko) {
    return false;
  }
  
  // Deep check for overrideStates
  const prevOverrides = prevProps.overrideStates || {};
  const nextOverrides = nextProps.overrideStates || {};
  if (prevOverrides.lunch !== nextOverrides.lunch) {
    return false;
  }
  
  // The props are equal, so the component doesn't need to re-render
  return true;
}

export default memo(WorkHoursDisplay, workHoursDisplayPropsAreEqual);
