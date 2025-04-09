
import React from "react";
import TimeEntryDialog from "../TimeEntryDialog";
import { TimeEntry } from "@/types";

interface TimeEntryItemProps {
  entry: TimeEntry;
  date: Date;
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  onDeleteEntry: (id: string) => void;
}

const TimeEntryItem: React.FC<TimeEntryItemProps> = ({
  entry,
  date,
  onSaveEntry,
  onDeleteEntry,
}) => {
  const handleSaveEntry = (updatedEntry: Omit<TimeEntry, "id">) => {
    onSaveEntry(updatedEntry);
  };

  const handleDeleteEntry = (id?: string) => {
    if (id) {
      onDeleteEntry(id);
    }
  };

  return (
    <TimeEntryDialog
      onSave={handleSaveEntry}
      onDelete={handleDeleteEntry}
      selectedDate={date}
      entryId={entry.id}
      initialData={entry}
    />
  );
};

export default TimeEntryItem;
