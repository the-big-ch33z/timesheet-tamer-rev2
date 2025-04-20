
import { useCallback } from 'react';

// Define Timeout type to match NodeJS.Timeout
type Timeout = ReturnType<typeof setTimeout>;

export const useFormReset = ({
  setHours,
  setDescription,
  setJobNumber,
  setRego,
  setTaskNumber,
  setFormEdited,
  formKey,
  batchTimeoutRef,
  batchedChangesRef
}: {
  setHours: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setJobNumber: React.Dispatch<React.SetStateAction<string>>;
  setRego: React.Dispatch<React.SetStateAction<string>>;
  setTaskNumber: React.Dispatch<React.SetStateAction<string>>;
  setFormEdited: React.Dispatch<React.SetStateAction<boolean>>;
  formKey?: string | number;
  batchTimeoutRef: React.MutableRefObject<Timeout | null>;
  batchedChangesRef: React.MutableRefObject<Record<string, string>>;
}) => {
  // Reset all form fields and state
  const resetForm = useCallback(() => {
    console.debug('[useFormReset] Resetting form fields');
    
    // Clear any pending timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    
    // Clear any batched changes
    batchedChangesRef.current = {};
    
    // Reset all form fields
    setHours('');
    setDescription('');
    setJobNumber('');
    setRego('');
    setTaskNumber('');
    setFormEdited(false);
  }, [
    setHours,
    setDescription,
    setJobNumber,
    setRego,
    setTaskNumber,
    setFormEdited,
    batchTimeoutRef,
    batchedChangesRef
  ]);

  return { resetForm };
};
