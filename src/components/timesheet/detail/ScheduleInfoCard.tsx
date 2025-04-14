
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, CalendarOff } from "lucide-react";
import { WorkSchedule } from "@/types";
import { getDayScheduleInfo } from "@/utils/time/scheduleUtils";

interface ScheduleInfoCardProps {
  date: Date;
  workSchedule?: WorkSchedule;
}

const ScheduleInfoCard: React.FC<ScheduleInfoCardProps> = ({ 
  date, 
  workSchedule 
}) => {
  const scheduleInfo = getDayScheduleInfo(date, workSchedule);

  if (!workSchedule || !scheduleInfo) return null;
  
  return (
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
  );
};

export default ScheduleInfoCard;
