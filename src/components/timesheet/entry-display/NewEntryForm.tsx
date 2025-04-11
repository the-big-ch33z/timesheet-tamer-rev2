
import React from "react";
import TimeEntryDialog from "../TimeEntryDialog";
import { TimeEntry, WorkSchedule } from "@/types";

interface NewEntryFormProps {
  date: Date;
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  onCancel: () => void;
  workSchedule?: WorkSchedule;
}

const NewEntryForm: React.FC<NewEntryFormProps> = ({
  date,
  onSaveEntry,
  onCancel,
  workSchedule,
}) => {
  const handleSaveEntry = (entry: Omit<TimeEntry, "id">) => {
    onSaveEntry(entry);
  };

  return (
    <TimeEntryDialog
      onSave={handleSaveEntry}
      onDelete={onCancel}
      selectedDate={date}
      workSchedule={workSchedule}
    />
  );
};

export default NewEntryForm;
