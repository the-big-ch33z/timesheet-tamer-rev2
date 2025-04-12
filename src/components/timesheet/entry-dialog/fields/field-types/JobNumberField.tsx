
import React from "react";
import EntryField from "../EntryField";

interface JobNumberFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inline?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
}

const JobNumberField: React.FC<JobNumberFieldProps> = ({
  id,
  value,
  onChange,
  required = false,
  inline = false,
  disabled = false,
  showLabel = true,
}) => {
  return (
    <EntryField
      id={id}
      name="Job Number"
      value={value}
      onChange={onChange}
      placeholder="Job No."
      required={required}
      inline={inline}
      disabled={disabled}
      showLabel={showLabel}
    />
  );
};

export default JobNumberField;
