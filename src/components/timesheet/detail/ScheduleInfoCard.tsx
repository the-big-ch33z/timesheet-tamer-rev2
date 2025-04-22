
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, CalendarOff, CornerRightDown } from "lucide-react";
import { WorkSchedule } from "@/types";
import { getDayScheduleInfo } from "@/utils/time/scheduleUtils";
import { format } from "date-fns";
import { getHolidays } from "@/lib/holidays";
import { getWeekDay, getFortnightWeek } from "@/utils/time/scheduleUtils";
import { getShiftedRDODate } from "@/utils/time/rdoDisplay";

interface ScheduleInfoCardProps {
  date: Date;
  workSchedule?: WorkSchedule;
}

const ScheduleInfoCard: React.FC<ScheduleInfoCardProps> = ({ 
  date, 
  workSchedule 
}) => {
  if (!workSchedule) return null;

  // Check if this is a shifted RDO
  const holidays = getHolidays();
  const shiftInfo = getShiftedRDODate(date, holidays);
  
  // If this day is the destination of a shifted RDO from another day
  // we need to check if any RDO was shifted to this day
  let isTargetOfShiftedRdo = false;
  let originalRdoDate: Date | null = null;
  let originalScheduleInfo = null;
  
  // Check each potential RDO from recent days to see if any shift to this day
  for (let i = -7; i <= 0; i++) {
    const checkDate = new Date(date);
    checkDate.setDate(checkDate.getDate() + i);
    
    const weekdayName = getWeekDay(checkDate);
    const fortnightWeek = getFortnightWeek(checkDate);
    
    // Is this day an RDO?
    if (workSchedule.rdoDays[fortnightWeek].includes(weekdayName)) {
      const checkShiftInfo = getShiftedRDODate(checkDate, holidays);
      
      // If this RDO shifts to our current date
      if (checkShiftInfo.shifted && 
          checkShiftInfo.shifted.getDate() === date.getDate() &&
          checkShiftInfo.shifted.getMonth() === date.getMonth() &&
          checkShiftInfo.shifted.getFullYear() === date.getFullYear()) {
        
        isTargetOfShiftedRdo = true;
        originalRdoDate = checkDate;
        
        // Get original day's schedule
        originalScheduleInfo = {
          isRDO: true,
          hours: workSchedule.weeks[fortnightWeek][weekdayName],
          shiftReason: checkShiftInfo.reason
        };
        break;
      }
    }
  }
  
  // Get the standard schedule info for this day
  const scheduleInfo = getDayScheduleInfo(date, workSchedule);
  
  // If this is a target of a shifted RDO, use the original info
  const displayInfo = isTargetOfShiftedRdo && originalScheduleInfo ? originalScheduleInfo : scheduleInfo;
  
  if (!displayInfo) return null;
  
  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium flex items-center mb-2">
          <CalendarClock className="h-4 w-4 mr-2" />
          Schedule Information
        </h3>
        
        {isTargetOfShiftedRdo && originalRdoDate && (
          <div className="mb-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mb-1">
              Shifted RDO
            </Badge>
            <div className="flex items-center text-xs text-purple-600">
              <CornerRightDown className="h-3 w-3 mr-1" /> 
              From {format(originalRdoDate, 'MMM d, yyyy')}
              {originalScheduleInfo?.shiftReason && (
                <span className="ml-1">({originalScheduleInfo.shiftReason})</span>
              )}
            </div>
          </div>
        )}
        
        {displayInfo.isRDO ? (
          <div className="flex items-center">
            {!isTargetOfShiftedRdo && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Rostered Day Off (RDO)
              </Badge>
            )}
          </div>
        ) : displayInfo.isWorkingDay && displayInfo.hours ? (
          <div className="space-y-2">
            <div className="flex items-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Working Day
              </Badge>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              Scheduled hours: {displayInfo.hours.startTime} - {displayInfo.hours.endTime}
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
  );
};

export default ScheduleInfoCard;
