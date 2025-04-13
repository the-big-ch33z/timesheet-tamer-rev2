
import React, { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import { formatTimeForDisplay } from "@/utils/time/formatting/timeFormatting";
import { useToast } from "@/hooks/use-toast";
import { isValidTimeFormat } from "@/utils/time/validation";

interface TimeInputFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  interactive?: boolean;
  testId?: string;
  className?: string;
}

const TimeInputField: React.FC<TimeInputFieldProps> = ({
  label,
  value,
  onChange,
  interactive = false,
  testId,
  className = ""
}) => {
  const { toast } = useToast();
  const [localValue, setLocalValue] = useState(value);
  // Track if field is currently being edited
  const [isEditing, setIsEditing] = useState(false);
  
  // Use timeout for debouncing
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Sync with external value when it changes and we're not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Handle local changes with debounced validation
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setIsEditing(true);
    setLocalValue(newValue);
    
    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Set new timeout for validation
    debounceTimeout.current = setTimeout(() => {
      // Only validate and propagate if we have a value
      if (newValue) {
        if (isValidTimeFormat(newValue)) {
          if (onChange) {
            onChange(newValue);
          }
        } else {
          toast({
            title: "Invalid time format",
            description: "Please enter time in HH:MM format",
            variant: "destructive"
          });
        }
      } else {
        // For empty values, set a default
        const defaultValue = label.toLowerCase().includes("start") ? "09:00" : "17:00";
        setLocalValue(defaultValue);
        if (onChange) {
          onChange(defaultValue);
        }
      }
      setIsEditing(false);
    }, 500); // 500ms debounce
  }, [onChange, toast, label]);

  // Handle blur event to validate immediately
  const handleBlur = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = null;
    }
    
    if (!localValue) {
      // If empty, set a default value
      const defaultValue = label.toLowerCase().includes("start") ? "09:00" : "17:00";
      setLocalValue(defaultValue);
      if (onChange) {
        onChange(defaultValue);
      }
    } else if (!isValidTimeFormat(localValue)) {
      // If invalid, revert to the previous valid value
      setLocalValue(value);
      toast({
        title: "Invalid time format",
        description: "Reverting to the last valid time",
        variant: "destructive"
      });
    } else if (onChange) {
      // If valid, propagate the value
      onChange(localValue);
    }
    setIsEditing(false);
  }, [localValue, value, onChange, toast, label]);

  return (
    <div>
      <div className="text-sm text-amber-700 mb-1">{label}</div>
      <div className={`${interactive ? 'bg-white' : 'bg-white'} border border-amber-200 rounded-md p-2 flex items-center ${className}`}>
        {interactive ? (
          <input
            type="time"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className="text-lg bg-transparent w-full outline-none"
            data-testid={testId}
          />
        ) : (
          <span className="text-lg">
            {formatTimeForDisplay(localValue)}
          </span>
        )}
        <Clock className="h-4 w-4 ml-2 text-gray-400" />
      </div>
    </div>
  );
};

export default TimeInputField;
