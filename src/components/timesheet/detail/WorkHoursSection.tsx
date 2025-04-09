
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface WorkHoursSectionProps {
  onHoursCalculated?: (hours: string) => void;
}

const WorkHoursSection: React.FC<WorkHoursSectionProps> = ({ onHoursCalculated }) => {
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [totalHours, setTotalHours] = useState<string>("0.0");

  // Calculate total hours when start or end time changes
  useEffect(() => {
    if (startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      let hours = endHours - startHours;
      let minutes = endMinutes - startMinutes;
      
      if (minutes < 0) {
        hours--;
        minutes += 60;
      }
      
      const totalDecimalHours = hours + (minutes / 60);
      setTotalHours(totalDecimalHours.toFixed(1));

      if (onHoursCalculated) {
        onHoursCalculated(totalDecimalHours.toFixed(1));
      }
    } else {
      setTotalHours("0.0");
    }
  }, [startTime, endTime, onHoursCalculated]);

  return (
    <div className="bg-yellow-50 p-4 rounded-lg mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-medium">Work Hours</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600">Start Time</label>
          <div className="relative">
            <Input 
              type="time" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)}
              className="pr-10 bg-white"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600">End Time</label>
          <div className="relative">
            <Input 
              type="time" 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)}
              className="pr-10 bg-white"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600">Total Hours</label>
          <Input 
            type="text" 
            value={totalHours} 
            readOnly 
            className="bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default WorkHoursSection;
