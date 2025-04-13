
import { useState, useEffect, useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { calculateHoursFromTimes } from "@/components/timesheet/utils/timeCalculations";

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

export const useTimeEntryForm = ({
  initialData = {},
  formKey,
  onSave,
  selectedDate,
  userId,
  autoSave = false,
  disabled = false,
  autoCalculateHours = false
}: UseTimeEntryFormProps): UseTimeEntryFormReturn => {
  const { toast } = useToast();
  
  // Form state
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [rego, setRego] = useState("");
  const [taskNumber, setTaskNumber] = useState("");
  const [formEdited, setFormEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Time state (for entry creation)
  const [startTime, setStartTime] = useState(initialData.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialData.endTime || "17:00");

  // Reset form when initialData or formKey changes
  useEffect(() => {
    console.log("Resetting form with initialData:", initialData);
    setHours(initialData.hours?.toString() || "");
    setDescription(initialData.description || "");
    setJobNumber(initialData.jobNumber || "");
    setRego(initialData.rego || "");
    setTaskNumber(initialData.taskNumber || "");
    setStartTime(initialData.startTime || "09:00");
    setEndTime(initialData.endTime || "17:00");
    setFormEdited(false);
    setIsSubmitting(false);
  }, [initialData, formKey]);

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: string) => {
    console.log(`Field changed in useTimeEntryForm: ${field} = ${value}, disabled=${disabled}`);
    
    if (disabled) return;
    
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
      case 'taskNumber':
        setTaskNumber(value);
        break;
      case 'startTime':
        setStartTime(value);
        if (autoCalculateHours) {
          const calculatedHours = calculateHoursFromTimes(value, endTime);
          setHours(calculatedHours.toFixed(1));
        }
        break;
      case 'endTime':
        setEndTime(value);
        if (autoCalculateHours) {
          const calculatedHours = calculateHoursFromTimes(startTime, value);
          setHours(calculatedHours.toFixed(1));
        }
        break;
      default:
        break;
    }
  }, [formEdited, disabled, autoCalculateHours, startTime, endTime]);

  // Update time values
  const updateTimes = useCallback((newStartTime: string, newEndTime: string) => {
    console.log(`Updating times in useTimeEntryForm: ${newStartTime} to ${newEndTime}`);
    setStartTime(newStartTime);
    setEndTime(newEndTime);
  }, []);

  // Calculate and set hours based on start and end times
  const setHoursFromTimes = useCallback(() => {
    const calculatedHours = calculateHoursFromTimes(startTime, endTime);
    console.log(`Setting hours from times: ${startTime} to ${endTime} = ${calculatedHours}`);
    setHours(calculatedHours.toFixed(1));
    return calculatedHours;
  }, [startTime, endTime]);

  // Auto-save effect for inline forms
  useEffect(() => {
    if (autoSave && formEdited && 
       (hours || description || jobNumber || rego || taskNumber) && 
       !disabled && !isSubmitting && onSave) {
      
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 800);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hours, description, jobNumber, rego, taskNumber, formEdited, disabled, autoSave, isSubmitting]);

  // Prepare form data
  const getFormData = useCallback(() => ({
    date: selectedDate,
    hours: parseFloat(hours) || 0,
    description,
    jobNumber,
    rego,
    taskNumber,
    project: initialData.project || "General",
    userId: initialData.userId || userId || "",
    startTime,
    endTime,
  }), [selectedDate, hours, description, jobNumber, rego, taskNumber, initialData, userId, startTime, endTime]);

  // Reset form fields
  const resetForm = useCallback(() => {
    console.log("Resetting form fields");
    setHours("");
    setDescription("");
    setJobNumber("");
    setRego("");
    setTaskNumber("");
  }, []);

  // Handle form submission
  const handleSave = useCallback(() => {
    if (disabled || isSubmitting) return;
    if (autoSave && !hours) return; // Only validate hours for auto-save

    try {
      setIsSubmitting(true);
      const formData = getFormData();
      
      console.log("Saving form with data:", formData);
      
      if (onSave) {
        onSave(formData);
      }
      
      setFormEdited(false);
      
      // Allow the form to be submitted again after a short delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 300);
    } catch (error) {
      toast({
        title: "Error saving entry",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  }, [disabled, isSubmitting, autoSave, hours, getFormData, onSave, toast]);

  return {
    formState: {
      hours,
      description,
      jobNumber,
      rego,
      taskNumber,
      formEdited,
      userId: initialData.userId || userId,
      startTime,
      endTime
    },
    handleFieldChange,
    handleSave,
    getFormData,
    resetFormEdited: () => setFormEdited(false),
    resetForm,
    updateTimes,
    setHoursFromTimes,
    isSubmitting
  };
};
