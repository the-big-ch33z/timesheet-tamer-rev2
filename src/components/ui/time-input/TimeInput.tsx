
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { format, parse } from "date-fns";
import { Input } from "@/components/ui/input";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TimeInput');

interface TimeInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

// Parse time input in various formats with improved accuracy
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
      
      // Apply bounds checking
      if (hours >= 24) hours = 23;
      if (hours < 0) hours = 0;
      
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

    // If input already matches HH:MM format, ensure it's valid
    if (/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(timeString)) {
      const [hours, minutes] = timeString.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return input; // Return original if no pattern matched
  } catch (error) {
    logger.error("Error parsing time input:", error);
    return input;
  }
}

// Format time for display (24h -> 12h with AM/PM)
function formatDisplayTime(timeString: string): string {
  if (!timeString) return "";
  
  try {
    // Parse the 24-hour time string and format as 12-hour time
    const date = parse(timeString, 'HH:mm', new Date());
    return format(date, 'h:mm a');
  } catch (error) {
    logger.error("Error formatting time:", error);
    return timeString; // Return original on parsing error
  }
}

const TimeInput: React.FC<TimeInputProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  disabled = false,
  className = "",
  placeholder = "e.g. 8:30am"
}) => {
  const [displayValue, setDisplayValue] = useState(
    value ? formatDisplayTime(value) : ""
  );

  const [isFocused, setIsFocused] = useState(false);
  
  // Update display value when the prop value changes and we're not focused
  useEffect(() => {
    if (!isFocused && (value || value === "")) {
      setDisplayValue(value ? formatDisplayTime(value) : "");
    }
  }, [value, isFocused]);
  
  const handleChange = (newValue: string) => {
    setDisplayValue(newValue);
  };
  
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    
    // Parse the input value to a standard time format
    const parsedTime = parseTimeInput(displayValue);
    
    logger.debug(`TimeInput blur - parsed '${displayValue}' to '${parsedTime}'`);
    
    // Only call onChange if the value actually changed
    if (parsedTime !== value) {
      logger.debug(`TimeInput calling onChange with value: ${parsedTime}`);
      onChange(parsedTime);
    }
    
    // Update display format for readability
    if (parsedTime) {
      setDisplayValue(formatDisplayTime(parsedTime));
    }
    
    // Call the onBlur callback if provided
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className="text-sm text-gray-600 mb-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={`pr-10 ${className}`}
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Clock className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default TimeInput;
