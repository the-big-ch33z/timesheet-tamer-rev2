import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { Clock, AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getFortnightWeek, getWeekDay } from "../utils/scheduleUtils";

interface WorkHoursSectionProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
}

const WorkHoursSection: React.FC<WorkHoursSectionProps> = ({ entries, date, workSchedule }) => {
  // Calculate total hours from entries
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // Get start/end times from entries or schedule
  let startTime = "09:00";
  let endTime = "17:00";
  let expectedHours = 8.0;
  
  // If we have entries, use the first entry's times
  if (entries.length > 0) {
    startTime = entries[0].startTime || startTime;
    endTime = entries[0].endTime || endTime;
  } 
  // Otherwise, try to get times from workSchedule if available
  else if (workSchedule) {
    const weekDay = getWeekDay(date);
    const weekNum = getFortnightWeek(date);
    
    const scheduleDay = workSchedule.weeks[weekNum][weekDay];
    
    if (scheduleDay) {
      startTime = scheduleDay.startTime || startTime;
      endTime = scheduleDay.endTime || endTime;
      
      // Calculate expected hours from start and end time
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      const endHour = parseInt(endTime.split(':')[0]);
      const endMinute = parseInt(endTime.split(':')[1]);
      
      // Calculate total hours including partial hours
      expectedHours = endHour - startHour + (endMinute - startMinute) / 60;
    }
  }
  
  // Calculate variance from expected hours
  const hoursVariance = totalHours - expectedHours;
  const isUndertime = hoursVariance < 0;
  const hasEntries = entries.length > 0;
  
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
          <div className="bg-white border border-amber-200 rounded-md p-2 flex items-center">
            <span className="text-lg">{format(new Date(`2000-01-01T${startTime}`), "h:mm a")}</span>
            <Clock className="h-4 w-4 ml-2 text-gray-400" />
          </div>
        </div>
        
        <div>
          <div className="text-sm text-amber-700 mb-1">End Time</div>
          <div className="bg-white border border-amber-200 rounded-md p-2 flex items-center">
            <span className="text-lg">{format(new Date(`2000-01-01T${endTime}`), "h:mm a")}</span>
            <Clock className="h-4 w-4 ml-2 text-gray-400" />
          </div>
        </div>
        
        <div>
          <div className="text-sm text-amber-700 mb-1">Total Hours</div>
          <div className={`bg-white border ${hasEntries ? 'border-amber-200' : 'border-gray-200'} rounded-md p-2`}>
            <span className={`text-lg ${!hasEntries && 'text-gray-400'}`}>
              {totalHours.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end items-center">
        <div className="text-right">
          <div className="text-sm text-amber-700">Daily Target:</div>
          <div className="text-xl font-semibold text-amber-900">{expectedHours.toFixed(1)}</div>
        </div>
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
            No time entries recorded yet. Add an entry to track your hours.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WorkHoursSection;
