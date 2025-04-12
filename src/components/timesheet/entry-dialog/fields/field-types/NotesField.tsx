
import React from "react";
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
  return (
    <EntryField
      id={id}
      name="Notes"
      value={value}
      onChange={onChange}
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
