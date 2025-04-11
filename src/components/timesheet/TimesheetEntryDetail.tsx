
import React from "react";
import { format } from "date-fns";
import { TimeEntry, WorkSchedule, WeekDay } from "@/types";
import DetailHeader from "./detail/DetailHeader";
import WorkHoursSection from "./detail/WorkHoursSection";
import EntriesSection from "./detail/EntriesSection";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, CalendarOff } from "lucide-react";

interface TimesheetEntryDetailProps {
  date: Date;
  entries: TimeEntry[];
  onAddEntry: () => void;
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
  workSchedule?: WorkSchedule;
}

const TimesheetEntryDetail: React.FC<TimesheetEntryDetailProps> = ({
  date,
  entries,
  onAddEntry,
  onDeleteEntry,
  readOnly = false,
  workSchedule
}) => {
  const formattedDate = format(date, "MMM d, yyyy");
  const { toast } = useToast();
  
  // Helper function to get weekday from date
  const getWeekDay = (date: Date): WeekDay => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()] as WeekDay;
  };

  // Helper function to determine fortnight week (1 or 2)
  const getFortnightWeek = (date: Date): 1 | 2 => {
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const weeksSinceYearStart = Math.floor(
      (date.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return ((weeksSinceYearStart % 2) + 1) as 1 | 2;
  };

  // Get schedule information for the selected day
  const getDayScheduleInfo = () => {
    if (!workSchedule) return null;
    
    const weekDay = getWeekDay(date);
    const weekNum = getFortnightWeek(date);
    
    // Check if it's an RDO
    const isRDO = workSchedule.rdoDays[weekNum].includes(weekDay);
    
    if (isRDO) {
      return { 
        isWorkingDay: false, 
        isRDO: true, 
        hours: null 
      };
    }
    
    // Get scheduled work hours for this day
    const scheduledHours = workSchedule.weeks[weekNum][weekDay];
    
    return {
      isWorkingDay: !!scheduledHours,
      isRDO: false,
      hours: scheduledHours
    };
  };
  
  const scheduleInfo = getDayScheduleInfo();
  
  const handleDeleteEntry = (id: string) => {
    // If in read-only mode, prevent deletion and show toast
    if (readOnly) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete entries from this timesheet",
        variant: "destructive"
      });
      return;
    }
    
    try {
      onDeleteEntry(id);
    } catch (error) {
      toast({
        title: "Error deleting entry",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <DetailHeader date={date} formattedDate={formattedDate} />
      <div className="p-6 space-y-6">
        {workSchedule && scheduleInfo && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium flex items-center mb-2">
                <CalendarClock className="h-4 w-4 mr-2" />
                Schedule Information
              </h3>
              
              {scheduleInfo.isRDO ? (
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Rostered Day Off (RDO)
                  </Badge>
                </div>
              ) : scheduleInfo.isWorkingDay && scheduleInfo.hours ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Working Day
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Scheduled hours: {scheduleInfo.hours.startTime} - {scheduleInfo.hours.endTime}
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                    <CalendarOff className="h-3 w-3 mr-1" />
                    Non-working day
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <WorkHoursSection entries={entries} />
        <EntriesSection 
          date={date} 
          entries={entries} 
          onAddEntry={onAddEntry} 
          onDeleteEntry={handleDeleteEntry} 
          readOnly={readOnly}
          workSchedule={workSchedule}
        />
      </div>
    </div>
  );
};

export default TimesheetEntryDetail;
