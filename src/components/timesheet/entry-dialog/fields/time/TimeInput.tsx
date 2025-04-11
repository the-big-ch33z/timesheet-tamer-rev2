
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const TimeInput: React.FC<TimeInputProps> = ({ 
  id, 
  label, 
  value, 
  onChange 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
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
