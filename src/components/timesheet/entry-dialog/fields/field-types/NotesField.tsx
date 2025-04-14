
import React, { useEffect } from "react";
import EntryField from "../EntryField";

interface NotesFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inline?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

const NotesField: React.FC<NotesFieldProps> = ({
  id,
  value,
  onChange,
  required = false,
  inline = false,
  disabled = false,
  showLabel = true,
  className = "",
}) => {
  // Add specific logging for NotesField
  console.debug(`[NotesField] Rendering notes field (id: ${id}):`, {
    value,
    disabled,
    inline
  });
  
  // Track value changes
  useEffect(() => {
    console.debug(`[NotesField] Notes value updated (length: ${value?.length || 0})`);
  }, [value]);
  
  // Enhanced onChange handler
  const handleChange = (newValue: string) => {
    console.debug(`[NotesField] Notes changing to: '${newValue.substring(0, 20)}${newValue.length > 20 ? '...' : ''}'`);
    onChange(newValue);
  };

  return (
    <EntryField
      id={id}
      name="Notes"
      value={value}
      onChange={handleChange}
      placeholder="Notes"
      required={required}
      inline={inline}
      type={inline ? "text" : "textarea"}
      disabled={disabled}
      showLabel={showLabel}
      className={inline ? `flex-1 min-w-40 ${className}` : className}
    />
  );
};

export default NotesField;
