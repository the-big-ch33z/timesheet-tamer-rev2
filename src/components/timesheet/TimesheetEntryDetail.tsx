
import React from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import DetailHeader from "./detail/DetailHeader";
import WorkHoursSection from "./detail/WorkHoursSection";
import EntriesSection from "./detail/EntriesSection";
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
    canEditTimesheet,
    targetUserId
  } = useTimesheetContext();
  
  const formattedDate = format(date, "MMM d, yyyy");
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <DetailHeader date={date} formattedDate={formattedDate} />
      <div className="p-6 space-y-6">
        {workSchedule && (
          <ScheduleInfoCard date={date} workSchedule={workSchedule} />
        )}
        
        {/* Always display WorkHoursSection regardless of entries */}
        <WorkHoursSection 
          entries={entries} 
          date={date} 
          workSchedule={workSchedule} 
        />
        
        <EntriesSection 
          date={date} 
          entries={entries} 
          readOnly={!canEditTimesheet}
          userId={targetUserId}
        />
      </div>
    </div>
  );
};

export default TimesheetEntryDetail;
