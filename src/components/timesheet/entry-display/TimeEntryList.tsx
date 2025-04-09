
import React from "react";
import { TimeEntry } from "@/types";
import TimeEntryItem from "./TimeEntryItem";
import NewEntryForm from "./NewEntryForm";

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
  return (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground">No time entries for this day</p>
          {!readOnly && (
            <>
              <p className="text-sm text-muted-foreground mt-2">
                Click the "Add Entry" button to create a new entry
              </p>
              <NewEntryForm />
            </>
          )}
        </div>
      ) : (
        entries.map((entry) => (
          <TimeEntryItem 
            key={entry.id} 
            entry={entry} 
            onDelete={onDeleteEntry} 
            readOnly={readOnly}
          />
        ))
      )}
    </div>
  );
};

export default TimeEntryList;
