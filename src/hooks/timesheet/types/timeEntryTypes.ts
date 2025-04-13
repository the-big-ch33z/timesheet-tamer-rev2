
import { TimeEntry } from "@/types";

/**
 * State for time entry form
 */
export interface TimeEntryFormState {
  hours: string;
  description: string;
  jobNumber: string;
  rego: string;
  taskNumber: string;
  formEdited: boolean;
  userId?: string;
  startTime: string;
  endTime: string;
}

/**
 * Props for useTimeEntryForm hook
 */
export interface UseTimeEntryFormProps {
  initialData?: Partial<TimeEntry>;
  formKey?: string | number;
  onSave?: (entry: Omit<TimeEntry, "id">) => void;
  selectedDate: Date;
  userId?: string;
  autoSave?: boolean;
  disabled?: boolean;
  autoCalculateHours?: boolean;
}

/**
 * Return type for useTimeEntryForm hook
 */
export interface UseTimeEntryFormReturn {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void;
  getFormData: () => Omit<TimeEntry, "id">;
  resetFormEdited: () => void;
  resetForm: () => void;
  updateTimes: (startTime: string, endTime: string) => void;
  setHoursFromTimes: () => number;
  isSubmitting: boolean;
}
