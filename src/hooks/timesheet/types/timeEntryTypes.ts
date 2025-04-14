
import { TimeEntry } from "@/types";

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

export interface TimeEntryFormState {
  hours: string;
  description: string;
  jobNumber: string;
  rego: string;
  taskNumber: string;
  userId?: string;
  startTime: string;
  endTime: string;
  formEdited: boolean;
}

export interface UseTimeEntryFormReturn {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void;
  saveIfEdited: () => boolean; // New method to check and save if needed
  getFormData: () => Omit<TimeEntry, "id">;
  resetFormEdited: () => void;
  resetForm: () => void;
  updateTimes: (startTime: string, endTime: string) => void;
  setHoursFromTimes: () => number;
  isSubmitting: boolean;
}
