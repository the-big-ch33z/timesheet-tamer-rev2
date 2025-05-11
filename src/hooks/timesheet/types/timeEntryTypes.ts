
import { TimeEntry } from '@/types';

export interface TimeEntryFormState {
  hours: string;
  description: string;
  jobNumber: string;
  rego: string;
  taskNumber: string;
  formEdited: boolean;
  userId?: string;
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
  id: string; // Added the id property to fix TypeScript errors
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void;
  saveIfEdited: () => boolean;
  getFormData: () => any;
  resetFormEdited: () => void;
  resetForm: () => void;
  updateTimes: (startTime: string, endTime: string) => void;
  setHoursFromTimes: () => void;
  isSubmitting: boolean;
}

// New interfaces for timesheetWorkHours hook
export interface WorkHoursData {
  startTime: string;
  endTime: string;
  isCustom: boolean;
  hasData: boolean;
  calculatedHours: number;
}

export interface TimesheetWorkHoursHook {
  getWorkHoursForDate: (date: Date, specificUserId?: string) => WorkHoursData;
  saveWorkHoursForDate: (date: Date, startTime: string, endTime: string, specificUserId?: string) => boolean;
  hasCustomHours: (date: Date, specificUserId?: string) => boolean;
  resetWorkHours: (date: Date, specificUserId?: string) => void;
  clearAllWorkHours: (specificUserId?: string) => void;
  calculateDayHours: (date: Date, specificUserId?: string) => number;
  refreshWorkHours: () => void;
}
