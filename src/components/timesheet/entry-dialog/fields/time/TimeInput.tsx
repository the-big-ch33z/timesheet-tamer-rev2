
import React from "react";
import { Clock } from "lucide-react";
import EntryField from "../EntryField";

interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TimeInput: React.FC<TimeInputProps> = ({ 
  id, 
  label, 
  value, 
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <EntryField
          id={id}
          name={label}
          value={value}
          onChange={onChange}
          required
          disabled={disabled}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Clock className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default TimeInput;
