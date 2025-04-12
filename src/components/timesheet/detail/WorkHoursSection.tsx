
import React, { useState, useEffect } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { Clock, AlertTriangle, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getFortnightWeek, getWeekDay } from "../utils/scheduleUtils";
import { calculateHoursFromTimes } from "../entry-dialog/utils/timeCalculations";
import { Button } from "@/components/ui/button";

interface WorkHoursSectionProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const WorkHoursSection: React.FC<WorkHoursSectionProps> = ({ 
  entries, 
  date, 
  workSchedule,
  interactive = false,
  onCreateEntry
}) => {
  // State for times
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [calculatedHours, setCalculatedHours] = useState(8.0);
  
  // Calculate total hours from entries
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // Initialize times from entries or schedule
  useEffect(() => {
    let initialStartTime = "09:00";
    let initialEndTime = "17:00";
    
    // If we have entries, use the first entry's times
    if (entries.length > 0) {
      initialStartTime = entries[0].startTime || initialStartTime;
      initialEndTime = entries[0].endTime || initialEndTime;
    } 
    // Otherwise, try to get times from workSchedule if available
    else if (workSchedule) {
      const weekDay = getWeekDay(date);
      const weekNum = getFortnightWeek(date);
      
      const scheduleDay = workSchedule.weeks[weekNum][weekDay];
      
      if (scheduleDay) {
        initialStartTime = scheduleDay.startTime || initialStartTime;
        initialEndTime = scheduleDay.endTime || initialEndTime;
      }
    }
    
    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
    
    // Calculate hours from times
    const hours = calculateHoursFromTimes(initialStartTime, initialEndTime);
    setCalculatedHours(hours);
  }, [entries, date, workSchedule]);
  
  // Recalculate hours when times change
  useEffect(() => {
    const hours = calculateHoursFromTimes(startTime, endTime);
    setCalculatedHours(hours);
  }, [startTime, endTime]);
  
  // Calculate variance from expected hours
  const hoursVariance = totalHours - calculatedHours;
  const isUndertime = hoursVariance < 0;
  const hasEntries = entries.length > 0;
  
  // Handle time input changes
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
  };

  // Handle creating an entry
  const handleCreateEntry = () => {
    if (onCreateEntry) {
      onCreateEntry(startTime, endTime, calculatedHours);
    }
  };
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 mr-2 text-amber-700" />
        <h3 className="text-lg font-medium text-amber-900">Work Hours</h3>
        {!hasEntries && (
          <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
            No entries yet
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-sm text-amber-700 mb-1">Start Time</div>
          <div className={`${interactive ? 'bg-white' : 'bg-white'} border border-amber-200 rounded-md p-2 flex items-center`}>
            {interactive ? (
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="text-lg bg-transparent w-full outline-none"
              />
            ) : (
              <span className="text-lg">{format(new Date(`2000-01-01T${startTime}`), "h:mm a")}</span>
            )}
            <Clock className="h-4 w-4 ml-2 text-gray-400" />
          </div>
        </div>
        
        <div>
          <div className="text-sm text-amber-700 mb-1">End Time</div>
          <div className={`${interactive ? 'bg-white' : 'bg-white'} border border-amber-200 rounded-md p-2 flex items-center`}>
            {interactive ? (
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="text-lg bg-transparent w-full outline-none"
              />
            ) : (
              <span className="text-lg">{format(new Date(`2000-01-01T${endTime}`), "h:mm a")}</span>
            )}
            <Clock className="h-4 w-4 ml-2 text-gray-400" />
          </div>
        </div>
        
        <div>
          <div className="text-sm text-amber-700 mb-1">Total Hours</div>
          <div className={`bg-white border ${hasEntries ? 'border-amber-200' : 'border-gray-200'} rounded-md p-2`}>
            <span className={`text-lg ${!hasEntries && 'text-gray-400'}`}>
              {hasEntries ? totalHours.toFixed(1) : calculatedHours.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-right">
          <div className="text-sm text-amber-700">Daily Target:</div>
          <div className="text-xl font-semibold text-amber-900">{calculatedHours.toFixed(1)}</div>
        </div>

        {interactive && !hasEntries && (
          <Button 
            onClick={handleCreateEntry}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Entry
          </Button>
        )}
      </div>
      
      {hasEntries && isUndertime && (
        <Alert variant="destructive" className="mt-3 bg-red-50 border-red-200 text-red-800">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Hours don't match daily entries (under by {Math.abs(hoursVariance).toFixed(1)} hrs)
          </AlertDescription>
        </Alert>
      )}
      
      {!hasEntries && (
        <Alert className="mt-3 bg-blue-50 border-blue-200 text-blue-800">
          <Calendar className="h-4 w-4 mr-2" />
          <AlertDescription>
            {interactive ? "Set your work hours above, then create an entry to track your time." : "No time entries recorded yet. Add an entry to track your hours."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WorkHoursSection;
