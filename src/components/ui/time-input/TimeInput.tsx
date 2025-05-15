import React, { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import { format, parse } from "date-fns";
import { Input } from "@/components/ui/input";
import { createTimeLogger } from "@/utils/time/errors";
import { useDebounce } from "@/hooks/useDebounce";

const logger = createTimeLogger('TimeInput');

// Simple time format cache to avoid repeated parsing
const timeFormatCache = new Map<string, string>();

interface TimeInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  debounceMs?: number;
}

// Optimized time parsing function with caching
function parseTimeInput(input: string): string {
  // Return empty string for empty input
  if (!input || input.trim() === '') {
    return '';
  }
  
  // Check cache first
  const cacheKey = input.trim().toLowerCase();
  if (timeFormatCache.has(cacheKey)) {
    return timeFormatCache.get(cacheKey)!;
  }
  
  try {
    let timeString = cacheKey;
    let result = '';
    
    // Handle common formats with simplified regex
    if (/^\d{1,2}[:.]?\d{0,2}\s*(am|pm|a\.m\.|p\.m\.)?$/i.test(timeString)) {
      // Extract hours, minutes and period
      const parts = timeString.match(/(\d{1,2})([:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i);
      if (parts) {
        let hours = parseInt(parts[1], 10);
        const minutes = parts[3] ? parseInt(parts[3], 10) : 0;
        const period = parts[4] ? parts[4].toLowerCase() : null;
        
        // Handle 12-hour format
        if (period && period.startsWith('p') && hours < 12) {
          hours += 12;
        } else if (period && period.startsWith('a') && hours === 12) {
          hours = 0;
        }
        
        // Apply bounds
        if (hours >= 24) hours = 23;
        if (hours < 0) hours = 0;
        
        result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    // Handle 24-hour format like "1630"
    else if (/^\d{3,4}$/.test(timeString)) {
      if (timeString.length === 3) {
        timeString = '0' + timeString;
      }
      result = timeString.substring(0, 2) + ':' + timeString.substring(2);
    }
    // If input already matches HH:MM format, ensure it's valid
    else if (/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(timeString)) {
      const [hours, minutes] = timeString.split(':').map(Number);
      result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      result = input; // Return original if no pattern matched
    }
    
    // Cache the result for future use (keep cache size reasonable)
    if (timeFormatCache.size > 100) {
      // Clear the cache if it gets too large
      timeFormatCache.clear();
    }
    timeFormatCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    logger.error("Error parsing time input:", error);
    return input;
  }
}

// Optimized display formatting with caching
function formatDisplayTime(timeString: string): string {
  if (!timeString) return "";
  
  const cacheKey = `display_${timeString}`;
  if (timeFormatCache.has(cacheKey)) {
    return timeFormatCache.get(cacheKey)!;
  }
  
  try {
    // Parse the 24-hour time string and format as 12-hour time
    const date = parse(timeString, 'HH:mm', new Date());
    const formatted = format(date, 'h:mm a');
    
    // Cache the result
    timeFormatCache.set(cacheKey, formatted);
    return formatted;
  } catch (error) {
    logger.error("Error formatting time:", error, { timeString });
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
  placeholder = "e.g. 8:30am",
  debounceMs = 300
}) => {
  const [displayValue, setDisplayValue] = useState(
    value ? formatDisplayTime(value) : ""
  );

  const [isFocused, setIsFocused] = useState(false);
  
  // Create debounced onChange handler
  const debouncedOnChange = useDebounce((newValue: string) => {
    const parsedTime = parseTimeInput(newValue);
    logger.debug(`TimeInput debounced change: ${newValue} -> ${parsedTime}`);
    onChange(parsedTime);
  }, debounceMs);
  
  // Update display value when the prop value changes and we're not focused
  useEffect(() => {
    if (!isFocused && (value !== undefined)) {
      const formattedValue = value ? formatDisplayTime(value) : "";
      logger.debug(`TimeInput effect - updating display from prop: ${value} -> ${formattedValue}`);
      setDisplayValue(formattedValue);
    }
  }, [value, isFocused]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    logger.debug(`TimeInput handleChange: ${newValue}`);
    
    // Update display value immediately for responsive UI
    setDisplayValue(newValue);
    
    // Debounce the actual update to parent component
    debouncedOnChange(newValue);
  };
  
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    
    // Parse and format the current display value
    const parsedTime = parseTimeInput(displayValue);
    
    // Only update if there's a change to avoid unnecessary rerenders
    if (parsedTime !== value) {
      onChange(parsedTime);
    }
    
    // Format the display value
    if (parsedTime) {
      setDisplayValue(formatDisplayTime(parsedTime));
    }
    
    // Call the onBlur callback if provided
    if (onBlur) {
      onBlur();
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label 
          htmlFor={id || "time-input"} 
          className="block text-sm text-amber-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          id={id || "time-input"}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`pr-8 ${disabled ? "bg-gray-50" : "bg-white"}`}
          data-testid={id ? `time-input-${id}` : "time-input"}
        />
        <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

export default React.memo(TimeInput);
