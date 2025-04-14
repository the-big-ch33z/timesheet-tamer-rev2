
import { useState, useCallback, useEffect, useRef } from 'react';
import { TimeEntryFormState, UseTimeEntryFormProps } from './types/timeEntryTypes';
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { useToast } from "@/hooks/use-toast";

// Local storage key for saved form drafts
const FORM_DRAFT_STORAGE_KEY = 'timesheet-form-drafts';
// Debounce delay for form draft saving (ms)
const DRAFT_SAVE_DELAY = 1000;

/**
 * Hook to manage form state and field changes with improved handling
 */
export const useFormStateManagement = ({ 
  initialData = {}, 
  formKey,
  disabled = false,
  autoCalculateHours = false
}: Pick<UseTimeEntryFormProps, 'initialData' | 'formKey' | 'disabled' | 'autoCalculateHours'>) => {
  const { toast } = useToast();
  const formId = useRef<string>(formKey?.toString() || `form-${Date.now()}`);
  const batchedChangesRef = useRef<Record<string, string>>({});
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    
    // Clear any batched changes
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    batchedChangesRef.current = {};
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
    }, DRAFT_SAVE_DELAY);
    
    return () => {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
    };
  }, [hours, description, jobNumber, rego, taskNumber, startTime, endTime, formEdited, disabled]);

  // Process batched field changes
  const processBatchedChanges = useCallback(() => {
    console.debug("[useFormStateManagement] Processing batched changes", batchedChangesRef.current);
    
    const changes = batchedChangesRef.current;
    batchedChangesRef.current = {};
    
    // Apply all batched changes
    Object.entries(changes).forEach(([field, value]) => {
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
            break;
          case 'endTime':
            console.debug(`[useFormStateManagement] Setting endTime to ${value}`);
            setEndTime(value);
            break;
          default:
            console.warn(`[useFormStateManagement] Unknown field in batch: ${field}`);
            break;
        }
      } catch (error) {
        console.error(`[useFormStateManagement] Error processing batched change for ${field}:`, error);
      }
    });
    
    // Mark form as edited if we have changes
    if (Object.keys(changes).length > 0) {
      setFormEdited(true);
    }
  }, []);

  // Handle field changes with batching
  const handleFieldChange = useCallback((field: string, value: string) => {
    console.debug(`[useFormStateManagement] Field changed: ${field} = ${value}, disabled=${disabled}`);
    
    if (disabled) {
      console.debug("[useFormStateManagement] Form is disabled, ignoring field change");
      return;
    }
    
    try {
      // Add to batched changes
      batchedChangesRef.current[field] = value;
      
      // Handle special cases for time fields with auto-calculation
      if (autoCalculateHours && (field === 'startTime' || field === 'endTime')) {
        const newStartTime = field === 'startTime' ? value : startTime;
        const newEndTime = field === 'endTime' ? value : endTime;
        
        const calculatedHours = calculateHoursFromTimes(newStartTime, newEndTime);
        console.debug(`[useFormStateManagement] Auto-calculated hours: ${calculatedHours}`);
        batchedChangesRef.current['hours'] = calculatedHours.toFixed(1);
      }
      
      // Clear any existing batch timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      // Schedule processing of batched changes
      batchTimeoutRef.current = setTimeout(() => {
        processBatchedChanges();
        batchTimeoutRef.current = null;
      }, 50);
      
    } catch (error) {
      console.error("[useFormStateManagement] Error handling field change:", error);
      toast({
        title: "Error updating field",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  }, [disabled, autoCalculateHours, startTime, endTime, processBatchedChanges, toast]);

  // Update time values
  const updateTimes = useCallback((newStartTime: string, newEndTime: string) => {
    console.debug(`[useFormStateManagement] Updating times: ${newStartTime} to ${newEndTime}`);
    
    // Add to batched changes
    batchedChangesRef.current['startTime'] = newStartTime;
    batchedChangesRef.current['endTime'] = newEndTime;
    
    // Clear any existing batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    // Process immediately
    processBatchedChanges();
  }, [processBatchedChanges]);

  // Calculate hours from times
  const setHoursFromTimes = useCallback(() => {
    const calculatedHours = calculateHoursFromTimes(startTime, endTime);
    console.debug(`[useFormStateManagement] Setting hours from times: ${startTime} to ${endTime} = ${calculatedHours}`);
    
    // Add to batched changes
    batchedChangesRef.current['hours'] = calculatedHours.toFixed(1);
    
    // Clear any existing batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    // Process immediately
    processBatchedChanges();
    
    return calculatedHours;
  }, [startTime, endTime, processBatchedChanges]);

  // Reset form fields
  const resetForm = useCallback(() => {
    console.debug("[useFormStateManagement] Resetting form fields to empty values");
    setHours("");
    setDescription("");
    setJobNumber("");
    setRego("");
    setTaskNumber("");
    setFormEdited(false);
    
    // Clear any batched changes
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    batchedChangesRef.current = {};
    
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
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
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
