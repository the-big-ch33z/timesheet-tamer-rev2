
import { TimeEntry } from "@/types";

export interface TimeEntryFormState {
  hours: string;
  description: string;
  jobNumber: string;
  rego: string;
  taskNumber: string;
  startTime: string;
  endTime: string;
  formEdited: boolean;
}

export interface UseTimeEntryFormProps {
  initialData?: Partial<TimeEntry>;
  formKey?: string;
  onSave?: (entry: Omit<TimeEntry, "id">) => void;
  selectedDate?: Date;
  userId?: string;
  autoSave?: boolean;
  disabled?: boolean;
  autoCalculateHours?: boolean;
}

export interface UseTimeEntryFormReturn {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void; // Added this method to fix the TypeScript error
  saveIfEdited: () => boolean;
  getFormData: () => any;
  resetFormEdited: () => void;
  resetForm: () => void;
  updateTimes: (startTime: string, endTime: string) => void;
  setHoursFromTimes: () => void;
  isSubmitting: boolean;
}
