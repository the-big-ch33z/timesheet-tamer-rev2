
import React from "react";
import TimeEntryDialog from "../TimeEntryDialog";
import { TimeEntry, WorkSchedule } from "@/types";

interface NewEntryFormProps {
  date: Date;
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  onCancel: () => void;
  workSchedule?: WorkSchedule;
  userId?: string;
}

const NewEntryForm: React.FC<NewEntryFormProps> = ({
  date,
  onSaveEntry,
  onCancel,
  workSchedule,
  userId
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
      userId={userId}
    />
  );
};

export default NewEntryForm;
