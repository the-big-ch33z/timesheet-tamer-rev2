
import React from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import DetailHeader from "./detail/DetailHeader";
import ScheduleInfoCard from "./detail/ScheduleInfoCard";
import { useTimesheetContext } from "@/contexts/timesheet";

interface TimesheetEntryDetailProps {
  date: Date;
  entries: TimeEntry[];
}

const TimesheetEntryDetail: React.FC<TimesheetEntryDetailProps> = ({
  date,
  entries
}) => {
  const { 
    workSchedule,
  } = useTimesheetContext();
  
  const formattedDate = format(date, "MMM d, yyyy");
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <DetailHeader date={date} formattedDate={formattedDate} />
      <div className="p-6 space-y-6">
        {workSchedule && (
          <ScheduleInfoCard date={date} workSchedule={workSchedule} />
        )}
        
        {/* Entry section removed */}
        <div className="p-6 text-center bg-gray-50 border rounded-md">
          <p className="text-gray-500">
            Timesheet entry functionality has been removed
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimesheetEntryDetail;
