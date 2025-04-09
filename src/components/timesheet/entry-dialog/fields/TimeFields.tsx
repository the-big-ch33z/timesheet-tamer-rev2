
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

interface TimeFieldsProps {
  startTime: string;
  endTime: string;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
}

const TimeFields: React.FC<TimeFieldsProps> = ({ 
  startTime, 
  endTime, 
  setStartTime, 
  setEndTime 
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="startTime">Start Time</Label>
        <div className="relative">
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="pr-10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endTime">End Time</Label>
        <div className="relative">
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="pr-10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeFields;
