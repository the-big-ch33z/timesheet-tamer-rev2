
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
  placeholder?: string;
}

const TimeInputField: React.FC<TimeInputFieldProps> = ({
  label,
  value,
  onChange,
  interactive = true,
  testId,
  placeholder = "--:--"
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop changes
  useEffect(() => {
    console.log(`[TimeInputField] Value prop updated for ${label}: '${value}'`);
    setLocalValue(value);
  }, [value, label]);
  
  // Handle input changes with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log(`[TimeInputField] Input changed for ${label}: '${newValue}'`);
    setLocalValue(newValue);
    
    // Debounce the update to parent component
    // This reduces the number of state updates when typing
    const timer = setTimeout(() => {
      if (interactive && newValue !== value) {
        console.log(`[TimeInputField] Debounced update for ${label}: '${newValue}'`);
        onChange(newValue);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  };
  
  // Determine if the input is empty to apply placeholder styling
  const isEmpty = !localValue || localValue === "";
  
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
          className={`pr-10 ${isEmpty ? 'text-gray-400 placeholder-shown' : ''}`}
          data-testid={testId}
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Clock className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default TimeInputField;
