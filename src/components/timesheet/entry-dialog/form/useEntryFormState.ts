
import { useState, useEffect } from 'react';
import { TimeEntry } from "@/types";

export interface EntryFormState {
  hours: string;
  description: string;
  jobNumber: string;
  rego: string;
  taskNumber: string; // Added task number field
  formEdited: boolean;
}

export const useEntryFormState = (
  initialData: Partial<TimeEntry> = {},
  formKey?: string | number
) => {
  // Initialize state with initialData or defaults
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [rego, setRego] = useState("");
  const [taskNumber, setTaskNumber] = useState(""); // Added task number state
  const [formEdited, setFormEdited] = useState(false);

  // Reset form values when initialData or formKey changes
  useEffect(() => {
    setHours(initialData.hours?.toString() || "");
    setDescription(initialData.description || "");
    setJobNumber(initialData.jobNumber || "");
    setRego(initialData.rego || "");
    setTaskNumber(initialData.taskNumber || ""); // Reset task number from initialData
    setFormEdited(false);
  }, [initialData, formKey]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    if (!formEdited) {
      setFormEdited(true);
    }

    switch (field) {
      case 'hours':
        setHours(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'jobNumber':
        setJobNumber(value);
        break;
      case 'rego':
        setRego(value);
        break;
      case 'taskNumber': // Added case for task number
        setTaskNumber(value);
        break;
      default:
        break;
    }
  };

  // Prepare form data for submission
  const getFormData = (selectedDate: Date) => ({
    date: selectedDate,
    hours: parseFloat(hours) || 0,
    description,
    jobNumber,
    rego,
    taskNumber, // Include task number in form data
    project: initialData.project || "General",
    userId: initialData.userId || "", // Add userId from initialData
  });

  return {
    formState: {
      hours,
      description,
      jobNumber,
      rego,
      taskNumber, // Include task number in form state
      formEdited
    },
    handleFieldChange,
    getFormData,
    resetFormEdited: () => setFormEdited(false)
  };
};
