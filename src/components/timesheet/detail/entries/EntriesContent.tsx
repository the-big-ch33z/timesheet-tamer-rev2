
import React from "react";
import { TimeEntry } from "@/types";
import TimeEntryList from "../../entry-display/TimeEntryList";

interface EntriesContentProps {
  date: Date;
  entries: TimeEntry[];
  readOnly: boolean;
  userId?: string;
  formKey: string;
  onDeleteEntry: (id: string) => void;
}

const EntriesContent: React.FC<EntriesContentProps> = ({
  entries,
  onDeleteEntry
}) => {
  return (
    <div className="mt-4">
      <TimeEntryList 
        entries={entries}
        onDeleteEntry={onDeleteEntry}
        readOnly={true} // Always read-only
      />
    </div>
  );
};

export default EntriesContent;
