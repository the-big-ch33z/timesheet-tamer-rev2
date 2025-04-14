
import React from "react";
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
  // Add console log to track disabled state
  console.debug(`[GenericField] Rendering field '${name}' with disabled=${disabled}`);
  
  return (
    <EntryField
      id={id}
      name={name}
      value={value}
      onChange={onChange}
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
