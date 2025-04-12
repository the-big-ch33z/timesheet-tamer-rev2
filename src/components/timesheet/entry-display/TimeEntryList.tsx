
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
      {entries.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-muted-foreground">No time entries for this day</p>
          {!readOnly && (
            <p className="text-sm text-muted-foreground mt-2">
              Click the "Add Entry" button to create a new entry
            </p>
          )}
        </div>
      ) : (
        entries.map((entry) => (
          <TimeEntryItem 
            key={entry.id} 
            entry={entry} 
            onDelete={() => handleDeleteEntry(entry.id)} 
            readOnly={readOnly}
          />
        ))
      )}
    </div>
  );
};

export default TimeEntryList;
