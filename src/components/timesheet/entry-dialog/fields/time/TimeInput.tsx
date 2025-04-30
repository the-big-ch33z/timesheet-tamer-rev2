
import React from "react";
import EntryField from "../EntryField";
import TimeInput from "@/components/ui/time-input/TimeInput";

interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

// This component now serves as a wrapper around our new TimeInput component
// to maintain compatibility with existing code
const TimeInputWrapper: React.FC<TimeInputProps> = ({ 
  id, 
  label, 
  value, 
  onChange,
  onBlur,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <TimeInput
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className="w-full"
        placeholder="e.g. 8:30am"
      />
    </div>
  );
};

export default TimeInputWrapper;
