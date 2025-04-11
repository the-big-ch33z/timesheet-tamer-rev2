
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
    // Forward the entry to the parent component
    onSaveEntry({
      ...entry,
      userId: userId // Ensure userId gets added to the entry
    });
  };

  return (
    <TimeEntryDialog
      onSave={handleSaveEntry}
      onDelete={onCancel}
      selectedDate={date}
      workSchedule={workSchedule}
      userId={userId}
      key={`entry-form-${Date.now()}`} // Add a unique key to force proper re-render
    />
  );
};

export default NewEntryForm;
