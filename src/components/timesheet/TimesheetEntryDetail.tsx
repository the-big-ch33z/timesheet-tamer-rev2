
import React from "react";
import { format } from "date-fns";
import { TimeEntry, WorkSchedule } from "@/types";
import DetailHeader from "./detail/DetailHeader";
import WorkHoursSection from "./detail/WorkHoursSection";
import EntriesSection from "./detail/EntriesSection";
import ScheduleInfoCard from "./detail/ScheduleInfoCard";

interface TimesheetEntryDetailProps {
  date: Date;
  entries: TimeEntry[];
  onAddEntry: (entry: Omit<TimeEntry, "id">) => void;
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
  workSchedule?: WorkSchedule;
  userId?: string;
}

const TimesheetEntryDetail: React.FC<TimesheetEntryDetailProps> = ({
  date,
  entries,
  onAddEntry,
  onDeleteEntry,
  readOnly = false,
  workSchedule,
  userId
}) => {
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
          onAddEntry={onAddEntry} 
          onDeleteEntry={onDeleteEntry} 
          readOnly={readOnly}
          workSchedule={workSchedule}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default TimesheetEntryDetail;
