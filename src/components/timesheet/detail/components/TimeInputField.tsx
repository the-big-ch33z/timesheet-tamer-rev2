
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
  disabled?: boolean;
  className?: string; // Added className prop
  "aria-label"?: string; // Added aria-label prop
}

export const TimeInputField: React.FC<TimeInputFieldProps> = memo(({
  label,
  value,
  type = 'start',
  interactive,
  onChange,
  testId,
  placeholder,
  disabled = false,
  className,
  "aria-label": ariaLabel
}) => {
  // Remove default values - display empty string if no value is provided
  const displayValue = value || "";
  
  const handleChange = useCallback((newValue: string) => {
    logger.debug(`TimeInputField change: ${type} = ${newValue}`);
    onChange(type, newValue);
  }, [type, onChange]);
  
  return (
    <div className={className}>
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
            aria-label={ariaLabel}
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
