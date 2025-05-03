
import { useCallback, useMemo } from 'react';
import { ensureDate } from '@/utils/time/validation';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useFormDataPreparation');

/**
 * Hook for preparing form data before submission
 */
export const useFormDataPreparation = ({ 
  initialData = {}, 
  selectedDate,
  userId
}: {
  initialData?: Record<string, any>;
  selectedDate: Date | null;
  userId: string;
}) => {
  // Memoize the function to prevent unnecessary recreations
  const getFormData = useCallback((formState: {
    hours: string;
    description: string;
    jobNumber: string;
    rego: string;
    taskNumber: string;
    formEdited: boolean;
  }) => {
    logger.debug("[useFormDataPreparation] Preparing form data:", formState);
    
    if (!selectedDate) {
      logger.warn("[useFormDataPreparation] No selected date provided");
      throw new Error("No date selected");
    }
    
    // Parse numerical hours from string
    let hours;
    if (typeof formState.hours === 'string') {
      // Improved parsing with validation
      const trimmedHours = formState.hours.trim();
      
      // Log the raw value
      logger.debug(`[useFormDataPreparation] Raw hours value: '${formState.hours}', trimmed: '${trimmedHours}'`);
      
      if (trimmedHours === '') {
        logger.warn("[useFormDataPreparation] Empty hours value");
        throw new Error("Hours must be provided");
      }
      
      hours = parseFloat(trimmedHours);
      
      if (isNaN(hours)) {
        logger.warn(`[useFormDataPreparation] Invalid hours value: ${formState.hours}`);
        throw new Error("Hours must be a valid number");
      }
      
      // Snap to quarter hour
      hours = Math.round(hours * 4) / 4;
      
      logger.debug(`[useFormDataPreparation] Parsed hours: ${hours}`);
    } else if (typeof formState.hours === 'number') {
      hours = formState.hours;
      logger.debug(`[useFormDataPreparation] Using numeric hours: ${hours}`);
    } else {
      logger.warn(`[useFormDataPreparation] Missing hours value`);
      throw new Error("Hours must be provided");
    }
    
    if (hours <= 0) {
      logger.warn(`[useFormDataPreparation] Invalid hours value: ${hours} (must be > 0)`);
      throw new Error("Hours must be greater than zero");
    }
    
    // Create the processed form data
    const formData = {
      ...initialData,
      hours,
      description: formState.description,
      jobNumber: formState.jobNumber,
      rego: formState.rego,
      taskNumber: formState.taskNumber,
      userId,
      date: selectedDate,
      project: initialData.project || 'General'
    };
    
    logger.debug(`[useFormDataPreparation] Prepared form data:`, formData);
    
    return formData;
  }, [initialData, selectedDate, userId]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({ 
    getFormData 
  }), [getFormData]);
};
