
import React from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeInputFieldProps {
  label: string;
  value: string;
  type: 'start' | 'end';
  interactive: boolean;
  onChange: (type: 'start' | 'end', value: string) => void;
}

export const TimeInputField: React.FC<TimeInputFieldProps> = ({
  label,
  value,
  type,
  interactive,
  onChange
}) => {
  return (
    <div>
      <div className="text-sm text-amber-700 mb-1">{label}</div>
      <div className={cn(
        "border rounded-md p-2 flex items-center",
        interactive ? "bg-white border-amber-200" : "bg-gray-50 border-gray-200"
      )}>
        {interactive ? (
          <input
            type="time"
            value={value}
            onChange={(e) => onChange(type, e.target.value)}
            className="text-lg bg-transparent w-full outline-none"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <span className="text-lg">
            {value ? format(new Date(`2000-01-01T${value}`), "h:mm a") : "--:--"}
          </span>
        )}
        <Clock className="h-4 w-4 ml-2 text-gray-400" />
      </div>
    </div>
  );
};
