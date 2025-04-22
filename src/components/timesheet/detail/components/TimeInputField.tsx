
import React, { memo } from "react";
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

export const TimeInputField: React.FC<TimeInputFieldProps> = memo(({
  label,
  value,
  type = 'start',
  interactive,
  onChange,
  testId,
  placeholder
}) => {
  // Use the new hook for handling input state
  const { localValue, handleChange } = useTimeInputState({
    value,
    onChange: (newValue) => onChange(type, newValue)
  });

  return (
    <div>
      <div className="text-sm text-amber-700 mb-1 mx-[9px]">{label}</div>
      <div className={cn(
        "border rounded-md p-2 flex items-center",
        interactive ? "bg-white border-amber-200" : "bg-gray-50 border-gray-200"
      )}>
        {interactive ? (
          <input
            id="time-input"
            type="time"
            value={localValue}
            onChange={e => handleChange(e.target.value)}
            className="text-lg bg-transparent w-full outline-none"
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            data-testid={testId}
          />
        ) : (
          <span className="text-lg">
            {localValue ? format(new Date(`2000-01-01T${localValue}`), "h:mm a") : "--:--"}
          </span>
        )}
        <Clock className="h-4 w-4 text-gray-400 ml-2" />
      </div>
    </div>
  );
});

TimeInputField.displayName = "TimeInputField";
