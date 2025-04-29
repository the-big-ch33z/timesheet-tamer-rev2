
import React from "react";
import { Input } from "@/components/ui/input";
import { Bell, Coffee } from "lucide-react";
import { format, parse } from "date-fns";

// Helper to round to nearest 0.25 for summary display
function roundToQuarter(value: number) {
  return Math.round(value * 4) / 4;
}

// Parse time input in various formats
function parseTimeInput(input: string): string {
  // Return empty string for empty input
  if (!input || input.trim() === '') {
    return '';
  }
  
  try {
    let timeString = input.trim().toLowerCase();
    
    // Handle common formats like "6:30am", "6:30 am", "6:30 a.m.", "0630", "06:30"
    const amPmRegex = /(\d{1,2})[:.]?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?$/i;
    const match = timeString.match(amPmRegex);
    
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3] ? match[3].toLowerCase() : null;
      
      // Handle 12-hour format
      if (period && (period.startsWith('p') || period.startsWith('p.')) && hours < 12) {
        hours += 12;
      } else if (period && (period.startsWith('a') || period.startsWith('a.')) && hours === 12) {
        hours = 0;
      }
      
      // Format as 24-hour time for the input
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Handle 24-hour format like "1630"
    if (/^\d{3,4}$/.test(timeString)) {
      if (timeString.length === 3) {
        timeString = '0' + timeString;
      }
      return timeString.substring(0, 2) + ':' + timeString.substring(2);
    }
    
    return input; // Return original if no pattern matched
  } catch (error) {
    console.error("Error parsing time input:", error);
    return input;
  }
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
  const handleTimeBlur = (type: 'start' | 'end', value: string) => {
    const parsedTime = parseTimeInput(value);
    if (parsedTime && parsedTime !== value) {
      onTimeChange(type, parsedTime);
    }
  };
  
  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return timeString;
    try {
      return format(parse(timeString, 'HH:mm', new Date()), 'hh:mm a');
    } catch (e) {
      return timeString;
    }
  };

  return (
    <div className="w-full p-4 bg-white border-t border-gray-200 rounded-b-md">
      <div className="flex items-center justify-start gap-6 mb-2">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Start Time</label>
          <Input
            type="text"
            value={interactive ? startTime : formatDisplayTime(startTime)}
            onChange={(e) => onTimeChange("start", e.target.value)}
            onBlur={(e) => handleTimeBlur("start", e.target.value)}
            disabled={!interactive}
            className="w-32"
            placeholder="e.g. 8:30am"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600">End Time</label>
          <Input
            type="text"
            value={interactive ? endTime : formatDisplayTime(endTime)}
            onChange={(e) => onTimeChange("end", e.target.value)}
            onBlur={(e) => handleTimeBlur("end", e.target.value)}
            disabled={!interactive}
            className="w-32"
            placeholder="e.g. 5:00pm"
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
