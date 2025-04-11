
import React from "react";
import { format } from "date-fns";
import { TimeEntry, WorkSchedule } from "@/types";
import DetailHeader from "./detail/DetailHeader";
import WorkHoursSection from "./detail/WorkHoursSection";
import EntriesSection from "./detail/EntriesSection";
import ScheduleInfoCard from "./detail/ScheduleInfoCard";
import { Card } from "@/components/ui/card";
import { useEntryActions } from "./hooks/useEntryActions";

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
  const { handleDeleteEntry } = useEntryActions({ 
    readOnly, 
    onDeleteEntry 
  });
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <DetailHeader date={date} formattedDate={formattedDate} />
      <div className="p-6 space-y-6">
        {workSchedule && (
          <ScheduleInfoCard date={date} workSchedule={workSchedule} />
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
