
import React, { useEffect, useState } from "react";
import TimeEntryDialog from "../TimeEntryDialog";
import { TimeEntry, WorkSchedule } from "@/types";

interface NewEntryFormProps {
  date: Date;
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  onCancel: () => void;
  workSchedule?: WorkSchedule;
  userId?: string;
  formKey?: string | number;
}

const NewEntryForm: React.FC<NewEntryFormProps> = ({
  date,
  onSaveEntry,
  onCancel,
  workSchedule,
  userId,
  formKey
}) => {
  // Local state to track form submissions
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset submission state when formKey changes
  useEffect(() => {
    setIsSubmitting(false);
  }, [formKey]);

  const handleSaveEntry = (entry: Omit<TimeEntry, "id">) => {
    // Prevent duplicate submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Forward the entry to the parent component
    onSaveEntry({
      ...entry,
      userId: entry.userId || userId // Ensure userId gets added to the entry
    });
  };

  return (
    <TimeEntryDialog
      onSave={handleSaveEntry}
      onCancel={onCancel}
      selectedDate={date}
      workSchedule={workSchedule}
      userId={userId}
      formKey={formKey} // Use our locally managed unique key
      initialData={{}} // Always start with empty data for new entries
    />
  );
};

export default NewEntryForm;
