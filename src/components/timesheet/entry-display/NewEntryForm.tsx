
import React from "react";
import TimeEntryDialog from "../TimeEntryDialog";
import { TimeEntry } from "@/types";

interface NewEntryFormProps {
  date: Date;
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  onCancel: () => void;
}

const NewEntryForm: React.FC<NewEntryFormProps> = ({
  date,
  onSaveEntry,
  onCancel,
}) => {
  const handleSaveEntry = (entry: Omit<TimeEntry, "id">) => {
    onSaveEntry(entry);
  };

  return (
    <TimeEntryDialog
      onSave={handleSaveEntry}
      onDelete={onCancel}
      selectedDate={date}
    />
  );
};

export default NewEntryForm;
