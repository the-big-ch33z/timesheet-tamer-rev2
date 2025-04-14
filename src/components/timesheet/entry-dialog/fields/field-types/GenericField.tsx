
import React, { useEffect } from "react";
import EntryField from "../EntryField";
import { EntryFieldType } from "../EntryField";

interface GenericFieldProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inline?: boolean;
  type?: EntryFieldType;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

const GenericField: React.FC<GenericFieldProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = "",
  required = false,
  inline = false,
  type = "text",
  disabled = false,
  showLabel = true,
  className = "",
}) => {
  // Enhanced logging to track field lifecycle and props
  console.debug(`[GenericField] Rendering field '${name}' (id: ${id}):`, {
    value,
    disabled,
    type,
  });
  
  // Monitor value changes
  useEffect(() => {
    console.debug(`[GenericField] Value updated for '${name}':`, value);
  }, [value, name]);
  
  // Enhanced onChange handler with detailed logging
  const handleChange = (newValue: string) => {
    console.debug(`[GenericField] '${name}' onChange triggered with value: '${newValue}'`);
    onChange(newValue);
    console.debug(`[GenericField] '${name}' onChange callback completed`);
  };

  return (
    <EntryField
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      inline={inline}
      type={type}
      disabled={disabled}
      showLabel={showLabel}
      className={className}
    />
  );
};

export default GenericField;
