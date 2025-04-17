
import { useEffect, useRef } from 'react';
import { useFormStateCore } from './form-state';
import { UseTimeEntryFormProps } from './types/timeEntryTypes';

/**
 * Main hook to manage form state and field changes with improved structure
 * Now delegates most functionality to specialized sub-hooks
 */
export const useFormStateManagement = ({ 
  initialData = {}, 
  formKey,
  disabled = false,
  autoCalculateHours = false
}: Pick<UseTimeEntryFormProps, 'initialData' | 'formKey' | 'disabled' | 'autoCalculateHours'>) => {
  // Create refs to clean up on unmount
  const saveDraftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the core form state hook
  const formStateCore = useFormStateCore({
    initialData,
    formKey,
    disabled,
    autoCalculateHours
  });

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
    };
  }, []);

  return formStateCore;
};

// Re-export the individual hooks for direct use if needed
export * from './form-state';
