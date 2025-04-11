
import React, { useState, useEffect } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const uniqueFormKey = `entry-form-${formKey || Date.now()}-${submissionCount}`;

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
      userId: userId // Ensure userId gets added to the entry
    });
    
    // Increment the submission count to generate a new form key after a short delay
    // This ensures the form fully resets for any subsequent entries
    setTimeout(() => {
      setSubmissionCount(prev => prev + 1);
      setIsSubmitting(false);
    }, 300);
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
