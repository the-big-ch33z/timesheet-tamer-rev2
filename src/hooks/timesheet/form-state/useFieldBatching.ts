
import { useRef, useCallback } from 'react';
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { Dispatch, SetStateAction } from 'react';
import { ToastAPI } from '../../use-toast';

interface UseFieldBatchingProps {
  setHours: Dispatch<SetStateAction<string>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setJobNumber: Dispatch<SetStateAction<string>>;
  setRego: Dispatch<SetStateAction<string>>;
  setTaskNumber: Dispatch<SetStateAction<string>>;
  setStartTime: Dispatch<SetStateAction<string>>;
  setEndTime: Dispatch<SetStateAction<string>>;
  setFormEdited: Dispatch<SetStateAction<boolean>>;
  disabled: boolean;
  startTime: string;
  endTime: string;
  autoCalculateHours: boolean;
  toast: ToastAPI;
}

/**
 * Hook to manage batched field changes for form performance
 */
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
  autoCalculateHours,
  toast
}: UseFieldBatchingProps) => {
  const batchedChangesRef = useRef<Record<string, string>>({});
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Process batched field changes
  const processBatchedChanges = useCallback(() => {
    console.debug("[useFieldBatching] Processing batched changes", batchedChangesRef.current);
    
    const changes = batchedChangesRef.current;
    batchedChangesRef.current = {};
    
    // Apply all batched changes
    Object.entries(changes).forEach(([field, value]) => {
      try {
        switch (field) {
          case 'hours':
            console.debug(`[useFieldBatching] Setting hours to ${value}`);
            setHours(value);
            break;
          case 'description':
            console.debug(`[useFieldBatching] Setting description to ${value}`);
            setDescription(value);
            break;
          case 'jobNumber':
            console.debug(`[useFieldBatching] Setting jobNumber to ${value}`);
            setJobNumber(value);
            break;
          case 'rego':
            console.debug(`[useFieldBatching] Setting rego to ${value}`);
            setRego(value);
            break;
          case 'taskNumber':
            console.debug(`[useFieldBatching] Setting taskNumber to ${value}`);
            setTaskNumber(value);
            break;
          case 'startTime':
            console.debug(`[useFieldBatching] Setting startTime to ${value}`);
            setStartTime(value);
            break;
          case 'endTime':
            console.debug(`[useFieldBatching] Setting endTime to ${value}`);
            setEndTime(value);
            break;
          default:
            console.warn(`[useFieldBatching] Unknown field in batch: ${field}`);
            break;
        }
      } catch (error) {
        console.error(`[useFieldBatching] Error processing batched change for ${field}:`, error);
      }
    });
    
    // Mark form as edited if we have changes
    if (Object.keys(changes).length > 0) {
      setFormEdited(true);
    }
  }, [setHours, setDescription, setJobNumber, setRego, setTaskNumber, setStartTime, setEndTime, setFormEdited]);

  // Handle field changes with batching
  const handleFieldChange = useCallback((field: string, value: string) => {
    console.debug(`[useFieldBatching] Field changed: ${field} = ${value}, disabled=${disabled}`);
    
    if (disabled) {
      console.debug("[useFieldBatching] Form is disabled, ignoring field change");
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
        console.debug(`[useFieldBatching] Auto-calculated hours: ${calculatedHours}`);
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
      console.error("[useFieldBatching] Error handling field change:", error);
      toast({
        title: "Error updating field",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  }, [disabled, autoCalculateHours, startTime, endTime, processBatchedChanges, toast]);
  
  return {
    batchedChangesRef,
    batchTimeoutRef,
    handleFieldChange,
    processBatchedChanges
  };
};
