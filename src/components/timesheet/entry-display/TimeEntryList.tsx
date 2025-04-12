
import React from "react";
import { TimeEntry } from "@/types";
import TimeEntryItem from "./TimeEntryItem";
import { useEntryActions } from "../hooks/useEntryActions";

interface TimeEntryListProps {
  entries: TimeEntry[];
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
}

const TimeEntryList: React.FC<TimeEntryListProps> = ({ 
  entries, 
  onDeleteEntry,
  readOnly = false
}) => {
  const { handleDeleteEntry } = useEntryActions({ 
    readOnly, 
    onDeleteEntry 
  });

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <TimeEntryItem 
          key={entry.id} 
          entry={entry} 
          onDelete={() => handleDeleteEntry(entry.id)} 
          readOnly={readOnly}
        />
      ))}
    </div>
  );
};

export default TimeEntryList;
