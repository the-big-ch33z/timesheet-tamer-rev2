
import React, { useState } from "react";
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
  // Local state to track form submissions and generate new keys
  const [submissionCount, setSubmissionCount] = useState(0);
  const uniqueFormKey = `entry-form-${formKey || Date.now()}-${submissionCount}`;

  const handleSaveEntry = (entry: Omit<TimeEntry, "id">) => {
    // Forward the entry to the parent component
    onSaveEntry({
      ...entry,
      userId: userId // Ensure userId gets added to the entry
    });
    
    // Increment the submission count to generate a new form key
    setSubmissionCount(prev => prev + 1);
  };

  return (
    <TimeEntryDialog
      onSave={handleSaveEntry}
      onCancel={onCancel}
      selectedDate={date}
      workSchedule={workSchedule}
      userId={userId}
      formKey={uniqueFormKey} // Use our locally managed unique key
      initialData={{}} // Always start with empty data for new entries
    />
  );
};

export default NewEntryForm;
