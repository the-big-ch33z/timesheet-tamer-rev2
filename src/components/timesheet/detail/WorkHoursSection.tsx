
import React from "react";
import { TimeEntry } from "@/types";
import { Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WorkHoursSectionProps {
  entries: TimeEntry[];
}

const WorkHoursSection: React.FC<WorkHoursSectionProps> = ({ entries }) => {
  // Calculate total hours from entries
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // Get the first entry for default start/end times (or use defaults)
  const firstEntry = entries[0] || { startTime: "09:00", endTime: "17:00" };
  
  // Mock data for the expected daily hours (would typically come from work schedule)
  const expectedHours = 8.0;
  const hoursVariance = totalHours - expectedHours;
  const isUndertime = hoursVariance < 0;
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 mr-2 text-amber-700" />
        <h3 className="text-lg font-medium text-amber-900">Work Hours</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-sm text-amber-700 mb-1">Start Time</div>
          <div className="bg-white border border-amber-200 rounded-md p-2 flex items-center">
            <span className="text-lg">{format(new Date(`2000-01-01T${firstEntry.startTime}`), "h:mm a")}</span>
            <Clock className="h-4 w-4 ml-2 text-gray-400" />
          </div>
        </div>
        
        <div>
          <div className="text-sm text-amber-700 mb-1">End Time</div>
          <div className="bg-white border border-amber-200 rounded-md p-2 flex items-center">
            <span className="text-lg">{format(new Date(`2000-01-01T${firstEntry.endTime}`), "h:mm a")}</span>
            <Clock className="h-4 w-4 ml-2 text-gray-400" />
          </div>
        </div>
        
        <div>
          <div className="text-sm text-amber-700 mb-1">Total Hours</div>
          <div className="bg-white border border-amber-200 rounded-md p-2">
            <span className="text-lg">{totalHours.toFixed(1)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <p className="text-sm text-amber-700">
            - 30min lunch break<br />
            <span className="text-green-600">15min smoko break included</span>
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-amber-700">Daily Total:</div>
          <div className="text-xl font-semibold text-amber-900">{expectedHours.toFixed(1)}</div>
        </div>
      </div>
      
      {isUndertime && (
        <Alert variant="destructive" className="mt-3 bg-red-50 border-red-200 text-red-800">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Hours don't match daily entries (under by {Math.abs(hoursVariance).toFixed(1)} hrs)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WorkHoursSection;
