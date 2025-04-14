
import { useState, useCallback, useEffect, useRef } from 'react';
import { TimeEntryFormState, UseTimeEntryFormProps } from './types/timeEntryTypes';
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { useToast } from "@/hooks/use-toast";

// Local storage key for saved form drafts
const FORM_DRAFT_STORAGE_KEY = 'timesheet-form-drafts';

/**
 * Hook to manage form state and field changes
 */
export const useFormStateManagement = ({ 
  initialData = {}, 
  formKey,
  disabled = false,
  autoCalculateHours = false
}: Pick<UseTimeEntryFormProps, 'initialData' | 'formKey' | 'disabled' | 'autoCalculateHours'>) => {
  const { toast } = useToast();
  const formId = useRef<string>(formKey?.toString() || `form-${Date.now()}`);
  
  // Track when disabled flag changes
  useEffect(() => {
    console.debug(`[useFormStateManagement] Disabled state changed to: ${disabled}`);
  }, [disabled]);
  
  // Form state
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [rego, setRego] = useState("");
  const [taskNumber, setTaskNumber] = useState("");
  const [formEdited, setFormEdited] = useState(false);
  
  // Time state
  const [startTime, setStartTime] = useState(initialData.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialData.endTime || "17:00");

  // Try to load any saved draft for this form
  useEffect(() => {
    if (!formKey) return;
    
    try {
      const savedDrafts = localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
      if (savedDrafts) {
        const drafts = JSON.parse(savedDrafts);
        const formDraft = drafts[formKey?.toString()];
        
        if (formDraft) {
          console.debug(`[useFormStateManagement] Found saved draft for form ${formKey}`, formDraft);
          
          if (formDraft.hours) setHours(formDraft.hours);
          if (formDraft.description) setDescription(formDraft.description);
          if (formDraft.jobNumber) setJobNumber(formDraft.jobNumber);
          if (formDraft.rego) setRego(formDraft.rego);
          if (formDraft.taskNumber) setTaskNumber(formDraft.taskNumber);
          if (formDraft.startTime) setStartTime(formDraft.startTime);
          if (formDraft.endTime) setEndTime(formDraft.endTime);
          
          // Only mark as edited if we have substantive content
          if (formDraft.hours || formDraft.description || formDraft.jobNumber || 
              formDraft.rego || formDraft.taskNumber) {
            setFormEdited(true);
          }
        }
      }
    } catch (error) {
      console.error("[useFormStateManagement] Error loading form draft:", error);
    }
  }, [formKey]);

  // Reset form when initialData or formKey changes
  useEffect(() => {
    console.debug("[useFormStateManagement] Resetting form with initialData:", initialData, "formKey:", formKey);
    
    // Update the formId if formKey changes
    if (formKey) {
      formId.current = formKey.toString();
    }
    
    setHours(initialData.hours?.toString() || "");
    setDescription(initialData.description || "");
    setJobNumber(initialData.jobNumber || "");
    setRego(initialData.rego || "");
    setTaskNumber(initialData.taskNumber || "");
    setStartTime(initialData.startTime || "09:00");
    setEndTime(initialData.endTime || "17:00");
    setFormEdited(false);
    console.debug("[useFormStateManagement] Form reset complete");
    
    // Clear any saved draft for this form
    if (formKey) {
      try {
        const savedDrafts = localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
        if (savedDrafts) {
          const drafts = JSON.parse(savedDrafts);
          if (drafts[formKey.toString()]) {
            delete drafts[formKey.toString()];
            localStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
            console.debug(`[useFormStateManagement] Cleared draft for form ${formKey}`);
          }
        }
      } catch (error) {
        console.error("[useFormStateManagement] Error clearing form draft:", error);
      }
    }
  }, [initialData, formKey]);

  // Save form draft when edited
  const saveDraftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!formEdited || disabled || !formId.current) return;
    
    // Clear any pending save
    if (saveDraftTimeoutRef.current) {
      clearTimeout(saveDraftTimeoutRef.current);
    }
    
    // Debounce save operation
    saveDraftTimeoutRef.current = setTimeout(() => {
      try {
        const formData = {
          hours,
          description,
          jobNumber,
          rego,
          taskNumber,
          startTime,
          endTime
        };
        
        console.debug(`[useFormStateManagement] Saving draft for form ${formId.current}`, formData);
        
        // Get existing drafts
        const savedDrafts = localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
        const drafts = savedDrafts ? JSON.parse(savedDrafts) : {};
        
        // Update draft for this form
        drafts[formId.current] = formData;
        
        // Save updated drafts
        localStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
      } catch (error) {
        console.error("[useFormStateManagement] Error saving form draft:", error);
      }
    }, 500);
    
    return () => {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
    };
  }, [hours, description, jobNumber, rego, taskNumber, startTime, endTime, formEdited, disabled]);

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: string) => {
    console.debug(`[useFormStateManagement] Field changed: ${field} = ${value}, disabled=${disabled}`);
    
    if (disabled) {
      console.debug("[useFormStateManagement] Form is disabled, ignoring field change");
      return;
    }
    
    // Always mark form as edited when a field changes
    setFormEdited(true);
    
    try {
      switch (field) {
        case 'hours':
          console.debug(`[useFormStateManagement] Setting hours to ${value}`);
          setHours(value);
          break;
        case 'description':
          console.debug(`[useFormStateManagement] Setting description to ${value}`);
          setDescription(value);
          break;
        case 'jobNumber':
          console.debug(`[useFormStateManagement] Setting jobNumber to ${value}`);
          setJobNumber(value);
          break;
        case 'rego':
          console.debug(`[useFormStateManagement] Setting rego to ${value}`);
          setRego(value);
          break;
        case 'taskNumber':
          console.debug(`[useFormStateManagement] Setting taskNumber to ${value}`);
          setTaskNumber(value);
          break;
        case 'startTime':
          console.debug(`[useFormStateManagement] Setting startTime to ${value}`);
          setStartTime(value);
          if (autoCalculateHours) {
            const calculatedHours = calculateHoursFromTimes(value, endTime);
            console.debug(`[useFormStateManagement] Auto-calculated hours: ${calculatedHours}`);
            setHours(calculatedHours.toFixed(1));
          }
          break;
        case 'endTime':
          console.debug(`[useFormStateManagement] Setting endTime to ${value}`);
          setEndTime(value);
          if (autoCalculateHours) {
            const calculatedHours = calculateHoursFromTimes(startTime, value);
            console.debug(`[useFormStateManagement] Auto-calculated hours: ${calculatedHours}`);
            setHours(calculatedHours.toFixed(1));
          }
          break;
        default:
          console.warn(`[useFormStateManagement] Unknown field: ${field}`);
          break;
      }
    } catch (error) {
      console.error("[useFormStateManagement] Error handling field change:", error);
      toast({
        title: "Error updating field",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  }, [disabled, autoCalculateHours, startTime, endTime, toast]);

  // Update time values
  const updateTimes = useCallback((newStartTime: string, newEndTime: string) => {
    console.debug(`[useFormStateManagement] Updating times: ${newStartTime} to ${newEndTime}`);
    setStartTime(newStartTime);
    setEndTime(newEndTime);
    // Mark form as edited when times are updated
    setFormEdited(true);
  }, []);

  // Calculate hours from times
  const setHoursFromTimes = useCallback(() => {
    const calculatedHours = calculateHoursFromTimes(startTime, endTime);
    console.debug(`[useFormStateManagement] Setting hours from times: ${startTime} to ${endTime} = ${calculatedHours}`);
    setHours(calculatedHours.toFixed(1));
    // Mark form as edited when hours are calculated
    setFormEdited(true);
    return calculatedHours;
  }, [startTime, endTime]);

  // Reset form fields
  const resetForm = useCallback(() => {
    console.debug("[useFormStateManagement] Resetting form fields to empty values");
    setHours("");
    setDescription("");
    setJobNumber("");
    setRego("");
    setTaskNumber("");
    setFormEdited(false);
    
    // Clear any saved draft for this form
    if (formId.current) {
      try {
        const savedDrafts = localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
        if (savedDrafts) {
          const drafts = JSON.parse(savedDrafts);
          if (drafts[formId.current]) {
            delete drafts[formId.current];
            localStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
            console.debug(`[useFormStateManagement] Cleared draft for form ${formId.current}`);
          }
        }
      } catch (error) {
        console.error("[useFormStateManagement] Error clearing form draft:", error);
      }
    }
  }, []);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
    };
  }, []);

  // Current form state
  const formState: TimeEntryFormState = {
    hours,
    description,
    jobNumber,
    rego,
    taskNumber,
    formEdited,
    userId: initialData.userId,
    startTime,
    endTime
  };

  return {
    formState,
    handleFieldChange,
    resetFormEdited: () => {
      console.debug("[useFormStateManagement] Resetting formEdited flag to false");
      setFormEdited(false);
      
      // Clear any saved draft when form is successfully submitted
      if (formId.current) {
        try {
          const savedDrafts = localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
          if (savedDrafts) {
            const drafts = JSON.parse(savedDrafts);
            if (drafts[formId.current]) {
              delete drafts[formId.current];
              localStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
              console.debug(`[useFormStateManagement] Cleared draft for form ${formId.current} after submission`);
            }
          }
        } catch (error) {
          console.error("[useFormStateManagement] Error clearing form draft:", error);
        }
      }
    },
    resetForm,
    updateTimes,
    setHoursFromTimes
  };
};
