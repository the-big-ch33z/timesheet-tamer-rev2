
import React from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import DetailHeader from "./detail/DetailHeader";
import WorkHoursSection from "./detail/WorkHoursSection";
import EntriesSection from "./detail/EntriesSection";

interface TimesheetEntryDetailProps {
  date: Date;
  entries: TimeEntry[];
  onAddEntry: () => void;
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
}

const TimesheetEntryDetail: React.FC<TimesheetEntryDetailProps> = ({
  date,
  entries,
  onAddEntry,
  onDeleteEntry,
  readOnly = false
}) => {
  const formattedDate = format(date, "MMM d, yyyy");
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <DetailHeader date={date} formattedDate={formattedDate} />
      <div className="p-6 space-y-6">
        <WorkHoursSection entries={entries} />
        <EntriesSection 
          date={date} 
          entries={entries} 
          onAddEntry={onAddEntry} 
          onDeleteEntry={onDeleteEntry} 
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};

export default TimesheetEntryDetail;
