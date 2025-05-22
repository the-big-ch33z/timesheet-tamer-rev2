
import React, { memo, useCallback } from "react";
import { Clock } from "lucide-react";
import TimeInput from "@/components/ui/time-input/TimeInput";
import { cn } from "@/lib/utils";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TimeInputField');

export interface TimeInputFieldProps {
  label: string;
  value: string;
  type?: 'start' | 'end';
  interactive: boolean;
  onChange: (type: 'start' | 'end', value: string) => void;
  testId?: string;
  placeholder?: string;
  disabled?: boolean; // Added disabled prop
}

export const TimeInputField: React.FC<TimeInputFieldProps> = memo(({
  label,
  value,
  type = 'start',
  interactive,
  onChange,
  testId,
  placeholder,
  disabled = false // Default to false
}) => {
  // Remove default values - display empty string if no value is provided
  const displayValue = value || "";
  
  const handleChange = useCallback((newValue: string) => {
    logger.debug(`TimeInputField change: ${type} = ${newValue}`);
    onChange(type, newValue);
  }, [type, onChange]);
  
  return (
    <div>
      <div className="text-sm text-amber-700 mb-1 mx-[9px]">{label}</div>
      <div className={cn(
        "border rounded-md p-2",
        interactive ? "bg-white border-amber-200" : "bg-gray-50 border-gray-200"
      )}>
        {interactive ? (
          <TimeInput
            id={`time-input-${type}`}
            value={displayValue}
            onChange={handleChange}
            disabled={disabled || !interactive}
            className="bg-transparent border-none shadow-none p-0 h-auto"
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            data-testid={testId}
          />
        ) : (
          <div className="flex items-center">
            <span className="text-lg flex-1">
              {displayValue ? displayValue : "--:--"}
            </span>
            <Clock className="h-4 w-4 text-gray-400 ml-2" />
          </div>
        )}
      </div>
    </div>
  );
});

TimeInputField.displayName = "TimeInputField";

export default TimeInputField;
