
import React from "react";
import TimeEntryItem from "./TimeEntryItem";
import { TimeEntry } from "@/types";

interface TimeEntryListProps {
  entries: TimeEntry[];
  date: Date;
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  onDeleteEntry: (id: string) => void;
}

const TimeEntryList: React.FC<TimeEntryListProps> = ({
  entries,
  date,
  onSaveEntry,
  onDeleteEntry,
}) => {
  return (
    <div className="space-y-2 mb-4">
      {entries.map((entry) => (
        <TimeEntryItem
          key={entry.id}
          entry={entry}
          date={date}
          onSaveEntry={onSaveEntry}
          onDeleteEntry={onDeleteEntry}
        />
      ))}
    </div>
  );
};

export default TimeEntryList;
