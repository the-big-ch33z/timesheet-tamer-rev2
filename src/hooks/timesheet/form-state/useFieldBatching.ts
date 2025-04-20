import { useRef, useCallback } from 'react';
import { calculateHoursFromTimes } from '@/utils/time/calculations';
import { useToast } from '@/hooks/use-toast';

// Standard field types for consistency
export const FIELD_TYPES = {
  HOURS: "hours",
  DESCRIPTION: "description",
  JOB_NUMBER: "jobNumber",
  REGO: "rego",
  TASK_NUMBER: "taskNumber",
  START_TIME: "startTime",
  END_TIME: "endTime"
};

// Standard toast notification patterns
export const TOAST_MESSAGES = {
  SUCCESS: (message: string) => ({ title: "Success", description: message }),
  ERROR: (message: string) => ({ title: "Error", description: message, variant: "destructive" }),
  WARNING: (message: string) => ({ title: "Warning", description: message, variant: "destructive" })
};

// Common validation patterns
export const validateTime = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return true;
  
  try {
    const hours = calculateHoursFromTimes(startTime, endTime);
    return hours > 0;
  } catch {
    return false;
  }
};

// Common time auto-calculation
export const calculateHoursString = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return "";
  
  try {
    const hours = calculateHoursFromTimes(startTime, endTime);
    return hours.toString();
  } catch (err) {
    console.error("[useFieldBatching] Error calculating hours:", err);
    return "";
  }
};

export const useFieldBatching = ({
  setHours,
  setDescription,
  setJobNumber,
  setRego,
  setTaskNumber,
  setStartTime,
  setEndTime,
  setFormEdited,
  disabled,
  startTime,
  endTime,
  autoCalculateHours = false,
  toast
}) => {
  // Keep track of batched changes
  const batchedChangesRef = useRef<Record<string, string>>({});
  const batchTimeoutRef = useRef<number | null>(null);
  
  // Process all batched changes at once
  const processBatchedChanges = useCallback(() => {
    if (disabled) return;
    
    const changes = batchedChangesRef.current;
    const hasChanges = Object.keys(changes).length > 0;
    
    if (hasChanges) {
      console.debug("[useFieldBatching] Processing batched changes:", changes);
      
      // Apply all changes
      if (FIELD_TYPES.HOURS in changes) setHours(changes[FIELD_TYPES.HOURS]);
      if (FIELD_TYPES.DESCRIPTION in changes) setDescription(changes[FIELD_TYPES.DESCRIPTION]);
      if (FIELD_TYPES.JOB_NUMBER in changes) setJobNumber(changes[FIELD_TYPES.JOB_NUMBER]);
      if (FIELD_TYPES.REGO in changes) setRego(changes[FIELD_TYPES.REGO]);
      if (FIELD_TYPES.TASK_NUMBER in changes) setTaskNumber(changes[FIELD_TYPES.TASK_NUMBER]);
      
      // Special handling for time fields
      const newStartTime = changes[FIELD_TYPES.START_TIME] !== undefined ? changes[FIELD_TYPES.START_TIME] : startTime;
      const newEndTime = changes[FIELD_TYPES.END_TIME] !== undefined ? changes[FIELD_TYPES.END_TIME] : endTime;
      
      if (FIELD_TYPES.START_TIME in changes) setStartTime(newStartTime);
      if (FIELD_TYPES.END_TIME in changes) setEndTime(newEndTime);
      
      // Auto-calculate hours from times if needed
      if (autoCalculateHours && 
          (FIELD_TYPES.START_TIME in changes || FIELD_TYPES.END_TIME in changes) &&
          newStartTime && newEndTime) {
        try {
          const hoursValue = calculateHoursString(newStartTime, newEndTime);
          if (hoursValue) {
            setHours(hoursValue);
            console.debug(`[useFieldBatching] Auto-calculated hours: ${hoursValue}`);
          }
        } catch (err) {
          console.error("[useFieldBatching] Error auto-calculating hours:", err);
          if (toast) {
            toast(TOAST_MESSAGES.ERROR("Could not calculate hours from times"));
          }
        }
      }
      
      // Mark form as edited
      setFormEdited(true);
      
      // Clear batched changes
      batchedChangesRef.current = {};
    }
  }, [
    disabled,
    setHours,
    setDescription,
    setJobNumber,
    setRego,
    setTaskNumber,
    setStartTime,
    setEndTime,
    setFormEdited,
    startTime,
    endTime,
    autoCalculateHours,
    toast
  ]);
  
  // Handle field changes with batching
  const handleFieldChange = useCallback((field: string, value: string) => {
    if (disabled) return;
    
    console.debug(`[useFieldBatching] Field change: ${field}=${value}`);
    
    // Store the change
    batchedChangesRef.current[field] = value;
    
    // Set a timeout to batch process changes
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    batchTimeoutRef.current = window.setTimeout(() => {
      processBatchedChanges();
      batchTimeoutRef.current = null;
    }, 100); // Small delay to batch rapid changes
  }, [disabled, processBatchedChanges]);
  
  return {
    batchedChangesRef,
    batchTimeoutRef,
    handleFieldChange,
    processBatchedChanges
  };
};
