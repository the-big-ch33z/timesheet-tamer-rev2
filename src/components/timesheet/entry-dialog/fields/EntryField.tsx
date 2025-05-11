
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Export the type so it can be imported in other files
export type EntryFieldType = "text" | "number" | "email" | "password" | "date" | "time" | "textarea";
interface EntryFieldProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  inline?: boolean;
  type?: EntryFieldType;
  className?: string;
  min?: string;
  max?: string;
  step?: string;
  disabled?: boolean;
  showLabel?: boolean;
}
const EntryField: React.FC<EntryFieldProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "",
  required = false,
  inline = false,
  type = "text",
  className = "",
  min,
  max,
  step,
  disabled = false,
  showLabel = true
}) => {
  const [touched, setTouched] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Update local value when prop changes
  useEffect(() => {
    console.debug(`[EntryField:useEffect:value] Field "${name}" (id: ${id}) value prop changed to: "${value}"`);
    setLocalValue(value);
  }, [value, name, id]);

  // Enhanced logging when component renders
  console.debug(`[EntryField] Rendering field "${name}" (id: ${id}):`, {
    value: value,
    localValue: localValue,
    disabled: disabled,
    type: type,
    required: required
  });

  // Log when disabled state changes
  useEffect(() => {
    console.debug(`[EntryField:useEffect:disabled] Field "${name}" (id: ${id}) disabled state changed to: ${disabled}`);
  }, [disabled, name, id]);

  // Enhanced change handler with more detailed logging
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.debug(`[EntryField:handleChange] Field "${name}" (id: ${id}) value changing from "${localValue}" to "${newValue}"`);

    // Update local state first for immediate feedback
    setLocalValue(newValue);

    // Call the provided onChange function
    console.debug(`[EntryField:handleChange] Before calling onChange for "${name}" (id: ${id})`);
    
    if (!onChange) {
      console.error(`[EntryField:handleChange] onChange handler is ${onChange === undefined ? 'undefined' : 'null'} for field "${name}" (id: ${id})`);
    } else {
      try {
        onChange(newValue);
        console.debug(`[EntryField:handleChange] Successfully called onChange for "${name}" (id: ${id})`);
      } catch (error) {
        console.error(`[EntryField:handleChange] Error calling onChange for "${name}" (id: ${id}):`, error);
      }
    }

    // Mark as touched
    if (!touched) {
      setTouched(true);
      console.debug(`[EntryField:handleChange] Marked field "${name}" (id: ${id}) as touched`);
    }
  };

  // Enhanced blur handler with logging
  const handleBlur = () => {
    console.debug(`[EntryField:handleBlur] Field "${name}" (id: ${id}) blur event - final value: "${localValue}"`);
    setTouched(true);
    if (onBlur) {
      try {
        onBlur();
        console.debug(`[EntryField:handleBlur] Successfully executed onBlur for "${name}" (id: ${id})`);
      } catch (error) {
        console.error(`[EntryField:handleBlur] Error executing onBlur for "${name}" (id: ${id}):`, error);
      }
    }
  };

  // Determine if field is in error state
  const hasError = required && touched && !localValue;
  const fieldClasses = `${className} ${hasError ? 'border-red-500' : ''}`;
  
  return (
    <div className={inline ? "flex items-center gap-2" : "space-y-2"}>
      {showLabel && (
        <Label htmlFor={id} className="block text-sm font-medium">
          {name}
        </Label>
      )}

      {type === "textarea" ? (
        <Textarea 
          id={id} 
          value={localValue} 
          onChange={handleChange} 
          onBlur={handleBlur} 
          placeholder={placeholder} 
          className={fieldClasses} 
          disabled={disabled} 
          required={required} 
          data-field-name={name} 
          data-testid={`textarea-${id}`} 
          aria-invalid={hasError} 
        />
      ) : (
        <Input 
          id={id} 
          type={type} 
          value={localValue} 
          onChange={handleChange} 
          onBlur={handleBlur} 
          placeholder={placeholder} 
          className={fieldClasses} 
          min={min} 
          max={max} 
          step={step} 
          disabled={disabled} 
          required={required} 
          data-field-name={name} 
          data-testid={`input-${id}`} 
          aria-invalid={hasError} 
        />
      )}

      {hasError && (
        <p className="text-red-500 text-xs mt-1">
          {name} is required
        </p>
      )}
    </div>
  );
};

export default EntryField;
