
import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface UseTimeInputStateProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const useTimeInputState = ({
  value,
  onChange,
  debounceMs = 300
}: UseTimeInputStateProps) => {
  // Local state for immediate updates
  const [localValue, setLocalValue] = useState(value);
  
  // Debounced callback for parent updates
  const debouncedOnChange = useDebounce(onChange, debounceMs);
  
  // Update local value when prop changes (if not focused)
  useEffect(() => {
    if (value !== localValue && document.activeElement?.id !== 'time-input') {
      setLocalValue(value);
    }
  }, [value, localValue]);
  
  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);
  
  return {
    localValue,
    handleChange
  };
};
