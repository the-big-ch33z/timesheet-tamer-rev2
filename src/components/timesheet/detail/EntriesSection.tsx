
import React from "react";
import { TimeEntry } from "@/types";
import TimeEntryList from "../entry-display/TimeEntryList";
import AddEntryButton from "../entry-display/AddEntryButton";

interface EntriesSectionProps {
  date: Date;
  entries: TimeEntry[];
  onAddEntry: () => void;
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
}

const EntriesSection: React.FC<EntriesSectionProps> = ({
  date,
  entries,
  onAddEntry,
  onDeleteEntry,
  readOnly = false
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Time Entries</h3>
        {!readOnly && <AddEntryButton onClick={onAddEntry} date={date} />}
      </div>
      
      <TimeEntryList 
        entries={entries} 
        onDeleteEntry={onDeleteEntry} 
        readOnly={readOnly}
      />
    </div>
  );
};

export default EntriesSection;
