
import { TimeEntry } from "@/types";

/**
 * State for the time entry form
 */
export interface TimeEntryFormState {
  hours: string;
  description: string;
  jobNumber: string;
  rego: string;
  taskNumber: string;
  startTime: string;
  endTime: string;
  project: string;
  formEdited: boolean;
}

/**
 * Props for the time entry form hook
 */
export interface UseTimeEntryFormProps {
  initialData?: Partial<TimeEntry>;
  formKey?: string;
  onSave?: (formData: Omit<TimeEntry, "id">) => void;
  selectedDate?: Date | null;
  userId?: string;
  autoSave?: boolean;
  disabled?: boolean;
  autoCalculateHours?: boolean;
}

/**
 * Return type of the time entry form hook
 */
export interface UseTimeEntryFormReturn {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string | number) => void;
  handleSave: () => void;
  saveIfEdited: () => boolean;
  getFormData: () => Omit<TimeEntry, "id">;
  resetFormEdited: () => void;
  resetForm: () => void;
  updateTimes: (startTime: string, endTime: string) => void;
  setHoursFromTimes: () => void;
  isSubmitting: boolean;
}
