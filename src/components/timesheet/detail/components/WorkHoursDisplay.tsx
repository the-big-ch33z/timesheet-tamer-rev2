
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Bell, Coffee, Save } from "lucide-react";
import TimeInput from "@/components/ui/time-input/TimeInput";
import { BreakConfig } from '@/contexts/timesheet/types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('WorkHoursDisplay');

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
  breaksIncluded: BreakConfig;
  overrideStates: {
    lunch: boolean;
  };
}

// A more optimized WorkHoursDisplay component with better memoization and controlled re-renders
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
  
  // Add state for save feedback
  const [showSaved, setShowSaved] = useState(false);
  
  // Track local values to detect changes
  const [lastValues, setLastValues] = useState({ startTime, endTime });
  
  // Memoize time handlers for better performance
  const handleStartTimeChange = useCallback((value: string) => {
    logger.debug(`[WorkHoursDisplay] Start time changing to: ${value}`);
    onTimeChange('start', value);
  }, [onTimeChange]);
  
  const handleEndTimeChange = useCallback((value: string) => {
    logger.debug(`[WorkHoursDisplay] End time changing to: ${value}`);
    onTimeChange('end', value);
  }, [onTimeChange]);
  
  // Memoize break displays for better performance
  const breakElements = useMemo(() => {
    const elements = [];
    
    if (breaksIncluded.lunch) {
      elements.push(
        <span key="lunch" className="flex items-center px-[0.5em] py-[0.15em] rounded-full bg-lime-50 border border-lime-200 text-lime-700 text-xs">
          <Bell className="h-3 w-3 mr-1" />
          Lunch subtracted
        </span>
      );
    }
    
    if (overrideStates.lunch) {
      elements.push(
        <span key="lunch-override" className="flex items-center px-[0.5em] py-[0.15em] rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs">
          <Bell className="h-3 w-3 mr-1" />
          Lunch override
        </span>
      );
    }
    
    if (breaksIncluded.smoko) {
      elements.push(
        <span key="smoko" className="flex items-center px-[0.5em] py-[0.15em] rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs">
          <Coffee className="h-3 w-3 mr-1" />
          Smoko subtracted
        </span>
      );
    }
    
    return elements;
  }, [breaksIncluded.lunch, breaksIncluded.smoko, overrideStates.lunch]);
  
  // Show saved indicator when times change
  useEffect(() => {
    if (startTime !== lastValues.startTime || endTime !== lastValues.endTime) {
      logger.debug('[WorkHoursDisplay] Time values updated');
      
      // Show save indicator
      setShowSaved(true);
      
      // Update tracked values
      setLastValues({ startTime, endTime });
      
      // Hide save indicator after 2 seconds
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [startTime, endTime, lastValues]);
  
  // Memoize hours summary to avoid recalculation on render
  const hoursSummary = useMemo(() => {
    return `${displayTotalHours.toFixed(2)} / ${displayCalculatedHours.toFixed(2)} hours`;
  }, [displayTotalHours, displayCalculatedHours]);

  return (
    <div className="w-full p-4 bg-white border-t border-gray-200 rounded-b-md">
      <div className="flex items-center justify-start gap-6 mb-2">
        <div className="flex flex-col">
          <TimeInput 
            id="start-time"
            label="Start Time"
            value={startTime}
            onChange={handleStartTimeChange}
            disabled={!interactive}
            className="w-32"
            placeholder="Enter start time"
            debounceMs={300}
          />
        </div>

        <div className="flex flex-col">
          <TimeInput 
            id="end-time"
            label="End Time"
            value={endTime}
            onChange={handleEndTimeChange}
            disabled={!interactive}
            className="w-32"
            placeholder="Enter end time"
            debounceMs={300}
          />
        </div>

        {/* Hours summary, proper display of entered/target hours */}
        <div className="flex flex-col justify-center">
          <div className="text-xs text-gray-500">Hours Summary</div>
          <div className="text-sm font-semibold text-gray-800">
            {hoursSummary}
          </div>
        </div>

        {/* Show saved status indicator */}
        {showSaved && (
          <div className="flex items-center text-green-600 text-xs animate-fade-in">
            <Save className="h-3 w-3 mr-1" />
            <span>Times saved!</span>
          </div>
        )}

        {/* Break chips - only show when they're actually being subtracted */}
        <div className="flex items-center gap-2 ml-4">
          {breakElements}
        </div>
      </div>
    </div>
  );
};

export default React.memo(WorkHoursDisplay);
