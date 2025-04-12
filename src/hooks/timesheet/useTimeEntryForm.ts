
import { useState, useEffect, useCallback } from 'react';
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";

export interface TimeEntryFormState {
  hours: string;
  description: string;
  jobNumber: string;
  rego: string;
  taskNumber: string;
  formEdited: boolean;
  userId?: string;
}

export interface UseTimeEntryFormReturn {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void;
  getFormData: () => Omit<TimeEntry, "id">;
  resetFormEdited: () => void;
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
  disabled = false
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

  // Reset form when initialData or formKey changes
  useEffect(() => {
    setHours(initialData.hours?.toString() || "");
    setDescription(initialData.description || "");
    setJobNumber(initialData.jobNumber || "");
    setRego(initialData.rego || "");
    setTaskNumber(initialData.taskNumber || "");
    setFormEdited(false);
    setIsSubmitting(false);
  }, [initialData, formKey]);

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: string) => {
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
      default:
        break;
    }
  }, [formEdited, disabled]);

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
  }), [selectedDate, hours, description, jobNumber, rego, taskNumber, initialData, userId]);

  // Handle form submission
  const handleSave = useCallback(() => {
    if (disabled || isSubmitting) return;
    if (autoSave && !hours) return; // Only validate hours for auto-save

    try {
      setIsSubmitting(true);
      const formData = getFormData();
      
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
      userId: initialData.userId || userId
    },
    handleFieldChange,
    handleSave,
    getFormData,
    resetFormEdited: () => setFormEdited(false),
    isSubmitting
  };
};
