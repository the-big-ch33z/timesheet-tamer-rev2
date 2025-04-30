
import React, { memo } from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import TimeInput from "@/components/ui/time-input/TimeInput";

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
            value={value}
            onChange={(newValue) => onChange(type, newValue)}
            disabled={!interactive}
            className="bg-transparent border-none shadow-none p-0 h-auto"
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            data-testid={testId}
          />
        ) : (
          <div className="flex items-center">
            <span className="text-lg flex-1">
              {value ? format(new Date(`2000-01-01T${value}`), "h:mm a") : "--:--"}
            </span>
            <Clock className="h-4 w-4 text-gray-400 ml-2" />
          </div>
        )}
      </div>
    </div>
  );
});

TimeInputField.displayName = "TimeInputField";
