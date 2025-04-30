
import React, { memo, useEffect } from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTimeInputState } from "@/hooks/timesheet/useTimeInputState";

interface TimeInputFieldProps {
  label: string;
  value: string;
  type?: 'start' | 'end';
  interactive: boolean;
  onChange: (type: 'start' | 'end', value: string) => void;
  testId?: string;
  placeholder?: string;
}

/**
 * Normalize time input to ensure HH:MM format
 */
const normalizeTimeValue = (value: string): string => {
  if (!value) return "";
  
  // If already in HH:MM format, ensure hours are two digits
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // If just a number, convert to HH:00 format
  if (/^\d{1,2}$/.test(value)) {
    return `${value.padStart(2, '0')}:00`;
  }
  
  // Return original value if it doesn't match expected patterns
  return value;
};

export const TimeInputField: React.FC<TimeInputFieldProps> = memo(({
  label,
  value,
  type = 'start',
  interactive,
  onChange,
  testId,
  placeholder
}) => {
  // Normalize initial value
  const normalizedValue = normalizeTimeValue(value);
  
  // Use the hook for handling input state
  const { localValue, handleChange } = useTimeInputState({
    value: normalizedValue,
    onChange: (newValue) => onChange(type, normalizeTimeValue(newValue))
  });
  
  // Format the display value properly for non-interactive mode
  const formattedDisplayValue = localValue ? 
    format(new Date(`2000-01-01T${normalizeTimeValue(localValue)}`), "h:mm a") : 
    "--:--";

  return (
    <div>
      <div className="text-sm text-amber-700 mb-1 mx-[9px]">{label}</div>
      <div className={cn(
        "border rounded-md p-2 flex items-center",
        interactive ? "bg-white border-amber-200" : "bg-gray-50 border-gray-200"
      )}>
        {interactive ? (
          <input
            id={`time-input-${type}`}
            type="time"
            value={localValue}
            onChange={e => handleChange(normalizeTimeValue(e.target.value))}
            className="text-lg bg-transparent w-full outline-none"
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            data-testid={testId}
          />
        ) : (
          <span className="text-lg">
            {formattedDisplayValue}
          </span>
        )}
        <Clock className="h-4 w-4 text-gray-400 ml-2" />
      </div>
    </div>
  );
});

TimeInputField.displayName = "TimeInputField";
