
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";

interface TimeInputFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  interactive?: boolean;
  testId?: string;
  className?: string;
}

const TimeInputField: React.FC<TimeInputFieldProps> = ({
  label,
  value,
  onChange,
  interactive = false,
  testId,
  className = ""
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value when it changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle local changes and propagate up
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div>
      <div className="text-sm text-amber-700 mb-1">{label}</div>
      <div className={`${interactive ? 'bg-white' : 'bg-white'} border border-amber-200 rounded-md p-2 flex items-center ${className}`}>
        {interactive ? (
          <input
            type="time"
            value={localValue}
            onChange={handleChange}
            className="text-lg bg-transparent w-full outline-none"
            data-testid={testId}
          />
        ) : (
          <span className="text-lg">
            {format(new Date(`2000-01-01T${localValue}`), "h:mm a")}
          </span>
        )}
        <Clock className="h-4 w-4 ml-2 text-gray-400" />
      </div>
    </div>
  );
};

export default TimeInputField;
