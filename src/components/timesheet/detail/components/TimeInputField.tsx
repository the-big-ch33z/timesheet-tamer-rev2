import React from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
interface TimeInputFieldProps {
  label: string;
  value: string;
  type?: 'start' | 'end';
  interactive: boolean;
  onChange: (type: 'start' | 'end', value: string) => void | ((value: string) => void);
  testId?: string;
  placeholder?: string;
}
export const TimeInputField: React.FC<TimeInputFieldProps> = ({
  label,
  value,
  type = 'start',
  interactive,
  onChange,
  testId,
  placeholder
}) => {
  // Handle change based on whether we receive a direct onChange or a type+value onChange
  const handleChange = (newValue: string) => {
    if (typeof onChange === 'function') {
      // Check if onChange expects type parameter
      if (onChange.length === 2) {
        (onChange as (type: 'start' | 'end', value: string) => void)(type, newValue);
      } else {
        (onChange as (value: string) => void)(newValue);
      }
    }
  };
  return <div>
      <div className="text-sm text-amber-700 mb-1">{label}</div>
      <div className={cn("border rounded-md p-2 flex items-center", interactive ? "bg-white border-amber-200" : "bg-gray-50 border-gray-200")}>
        {interactive ? <input type="time" value={value} onChange={e => handleChange(e.target.value)} className="text-lg bg-transparent w-full outline-none" placeholder={placeholder || `Enter ${label.toLowerCase()}`} data-testid={testId} /> : <span className="text-lg">
            {value ? format(new Date(`2000-01-01T${value}`), "h:mm a") : "--:--"}
          </span>}
        
      </div>
    </div>;
};