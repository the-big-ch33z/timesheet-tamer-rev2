
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

interface TimeInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  interactive?: boolean;
  testId?: string;
}

const TimeInputField: React.FC<TimeInputFieldProps> = ({
  label,
  value,
  onChange,
  interactive = true,
  testId
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Handle input changes with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Debounce the update to parent component
    // This reduces the number of state updates when typing
    const timer = setTimeout(() => {
      if (interactive && newValue !== value) {
        onChange(newValue);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  };
  
  return (
    <div>
      <Label htmlFor={label.toLowerCase()}>{label}</Label>
      <div className="relative">
        <Input
          id={label.toLowerCase()}
          type="time"
          value={localValue}
          onChange={handleChange}
          disabled={!interactive}
          className="pr-10"
          data-testid={testId}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Clock className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default TimeInputField;
