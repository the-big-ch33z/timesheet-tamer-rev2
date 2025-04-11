
import React from "react";
import { TimeEntry } from "@/types";
import NewEntryForm from "../../entry-display/NewEntryForm";
import TimeEntryList from "../../entry-display/TimeEntryList";

interface EntriesContentProps {
  isAddingEntry: boolean;
  date: Date;
  onCancelAddEntry: () => void;
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  entries: TimeEntry[];
  readOnly: boolean;
  userId?: string;
  formKey: string;
  onDeleteEntry: (id: string) => void;
}

const EntriesContent: React.FC<EntriesContentProps> = ({
  isAddingEntry,
  date,
  onCancelAddEntry,
  onSaveEntry,
  entries,
  readOnly,
  userId,
  formKey,
  onDeleteEntry
}) => {
  return (
    <>
      {isAddingEntry && (
        <div>
          <NewEntryForm 
            date={date} 
            onCancel={onCancelAddEntry}
            onSaveEntry={onSaveEntry}
            userId={userId}
            formKey={formKey}
          />
        </div>
      )}

      <TimeEntryList 
        entries={entries}
        onDeleteEntry={onDeleteEntry}
        readOnly={readOnly}
      />
    </>
  );
};

export default EntriesContent;
