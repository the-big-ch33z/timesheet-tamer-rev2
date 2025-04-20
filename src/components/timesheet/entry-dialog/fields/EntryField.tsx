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
    setLocalValue(value);
  }, [value]);

  // Enhanced logging when component renders
  console.debug(`[EntryField] Rendering field '${name}' (id: ${id}):`, {
    value: value,
    disabled: disabled,
    type: type,
    required: required
  });

  // Enhanced change handler with more detailed logging
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.debug(`[EntryField] '${name}' value changing from '${localValue}' to '${newValue}'`);

    // Update local state first for immediate feedback
    setLocalValue(newValue);

    // Call the provided onChange function
    onChange(newValue);

    // Verify the event was processed
    console.debug(`[EntryField] '${name}' onChange event dispatched`);

    // Mark as touched
    if (!touched) {
      setTouched(true);
    }
  };

  // Enhanced blur handler with logging
  const handleBlur = () => {
    console.debug(`[EntryField] '${name}' blur event - final value: '${localValue}'`);
    setTouched(true);
    if (onBlur) {
      onBlur();
      console.debug(`[EntryField] '${name}' onBlur callback executed`);
    }
  };

  // Determine if field is in error state
  const hasError = required && touched && !localValue;
  const fieldClasses = `${className} ${hasError ? 'border-red-500' : ''}`;
  return <div className={inline ? "flex items-center gap-2" : "space-y-2"}>
      {showLabel}

      {type === "textarea" ? <Textarea id={id} value={localValue} onChange={handleChange} onBlur={handleBlur} placeholder={placeholder} className={fieldClasses} disabled={disabled} required={required} data-field-name={name} data-testid={`textarea-${id}`} aria-invalid={hasError} /> : <Input id={id} type={type} value={localValue} onChange={handleChange} onBlur={handleBlur} placeholder={placeholder} className={fieldClasses} min={min} max={max} step={step} disabled={disabled} required={required} data-field-name={name} data-testid={`input-${id}`} aria-invalid={hasError} />}

      {hasError && <p className="text-red-500 text-xs mt-1">
          {name} is required
        </p>}
    </div>;
};
export default EntryField;