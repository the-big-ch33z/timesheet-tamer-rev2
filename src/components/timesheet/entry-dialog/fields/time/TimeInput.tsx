
import React, { useState } from "react";
import { Clock } from "lucide-react";
import EntryField from "../EntryField";
import { format, parse } from "date-fns";

interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
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

const TimeInput: React.FC<TimeInputProps> = ({ 
  id, 
  label, 
  value, 
  onChange,
  onBlur,
  disabled = false
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  const handleChange = (newValue: string) => {
    setDisplayValue(newValue);
  };
  
  const handleBlur = () => {
    const parsedTime = parseTimeInput(displayValue);
    onChange(parsedTime);
    
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <EntryField
          id={id}
          name={label}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          disabled={disabled}
          className="pr-10"
          placeholder="e.g. 8:30am"
          type="text"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Clock className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default TimeInput;
