
import React, { useEffect } from "react";
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
  showLabel = true,
}) => {
  // Enhanced logging when component renders
  console.debug(`[EntryField] Rendering field '${name}' (id: ${id}):`, {
    value: value,
    disabled: disabled,
    type: type,
  });

  // Log when value changes from props
  useEffect(() => {
    console.debug(`[EntryField] Value updated for '${name}' (id: ${id}):`, value);
  }, [value, id, name]);

  // Enhanced change handler with more detailed logging
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.debug(`[EntryField] '${name}' value changing from '${value}' to '${newValue}'`);
    
    // Call the provided onChange function
    onChange(newValue);
    
    // Verify the event was processed
    console.debug(`[EntryField] '${name}' onChange event dispatched`);
  };

  // Enhanced blur handler with logging
  const handleBlur = () => {
    console.debug(`[EntryField] '${name}' blur event - final value: '${value}'`);
    if (onBlur) {
      onBlur();
      console.debug(`[EntryField] '${name}' onBlur callback executed`);
    }
  };

  return (
    <div className={inline ? "flex items-center gap-2" : "space-y-2"}>
      {showLabel && (
        <Label
          htmlFor={id}
          className={`text-sm font-medium ${
            inline ? "mb-0 min-w-24" : "mb-1 block"
          }`}
        >
          {name}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {type === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          required={required}
          data-field-name={name}
          data-testid={`textarea-${id}`}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={className}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          required={required}
          data-field-name={name}
          data-testid={`input-${id}`}
        />
      )}
    </div>
  );
};

export default EntryField;
