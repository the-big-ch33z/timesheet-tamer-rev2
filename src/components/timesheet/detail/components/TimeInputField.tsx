
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

  // Enhanced logging for component rendering
  console.debug(`[TimeInputField] Rendering ${label} field:`, {
    value,
    localValue,
    interactive,
    isEditing
  });

  // Track when props change
  useEffect(() => {
    console.debug(`[TimeInputField] ${label} props updated:`, { value, interactive });
  }, [value, interactive, label]);

  // Sync with external value when it changes and we're not editing
  useEffect(() => {
    if (!isEditing) {
      console.debug(`[TimeInputField] ${label} syncing local value with prop:`, value);
      setLocalValue(value);
    } else {
      console.debug(`[TimeInputField] ${label} ignoring prop update while editing`);
    }
  }, [value, isEditing, label]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        console.debug(`[TimeInputField] ${label} cleanup: clearing timeout`);
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [label]);

  // Handle local changes with debounced validation
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.debug(`[TimeInputField] ${label} value changing to: ${newValue}`);
    setIsEditing(true);
    setLocalValue(newValue);
    
    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
      console.debug(`[TimeInputField] ${label} cleared existing timeout`);
    }
    
    // Set new timeout for validation
    console.debug(`[TimeInputField] ${label} setting new validation timeout`);
    debounceTimeout.current = setTimeout(() => {
      console.debug(`[TimeInputField] ${label} timeout triggered, validating: ${newValue}`);
      // Only validate and propagate if we have a value
      if (newValue) {
        if (isValidTimeFormat(newValue)) {
          console.debug(`[TimeInputField] ${label} valid time format: ${newValue}`);
          if (onChange) {
            console.debug(`[TimeInputField] ${label} calling onChange with: ${newValue}`);
            onChange(newValue);
          }
        } else {
          console.warn(`[TimeInputField] ${label} invalid time format: ${newValue}`);
          toast({
            title: "Invalid time format",
            description: "Please enter time in HH:MM format",
            variant: "destructive"
          });
        }
      } else {
        // For empty values, set a default
        const defaultValue = label.toLowerCase().includes("start") ? "09:00" : "17:00";
        console.debug(`[TimeInputField] ${label} empty value, using default: ${defaultValue}`);
        setLocalValue(defaultValue);
        if (onChange) {
          onChange(defaultValue);
        }
      }
      setIsEditing(false);
      console.debug(`[TimeInputField] ${label} editing complete`);
    }, 500); // 500ms debounce
  }, [onChange, toast, label]);

  // Handle blur event to validate immediately
  const handleBlur = useCallback(() => {
    console.debug(`[TimeInputField] ${label} blur event, current value: ${localValue}`);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = null;
      console.debug(`[TimeInputField] ${label} cleared timeout on blur`);
    }
    
    if (!localValue) {
      // If empty, set a default value
      const defaultValue = label.toLowerCase().includes("start") ? "09:00" : "17:00";
      console.debug(`[TimeInputField] ${label} empty on blur, using default: ${defaultValue}`);
      setLocalValue(defaultValue);
      if (onChange) {
        onChange(defaultValue);
      }
    } else if (!isValidTimeFormat(localValue)) {
      // If invalid, revert to the previous valid value
      console.warn(`[TimeInputField] ${label} invalid format on blur, reverting to: ${value}`);
      setLocalValue(value);
      toast({
        title: "Invalid time format",
        description: "Reverting to the last valid time",
        variant: "destructive"
      });
    } else if (onChange) {
      // If valid, propagate the value
      console.debug(`[TimeInputField] ${label} valid on blur, propagating: ${localValue}`);
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
            data-field-name={label}
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
