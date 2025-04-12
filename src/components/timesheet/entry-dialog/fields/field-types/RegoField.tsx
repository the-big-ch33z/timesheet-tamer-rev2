
import React from "react";
import EntryField from "../EntryField";

interface RegoFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inline?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
}

const RegoField: React.FC<RegoFieldProps> = ({
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
      name="Rego"
      value={value}
      onChange={onChange}
      placeholder="Rego"
      required={required}
      inline={inline}
      disabled={disabled}
      showLabel={showLabel}
    />
  );
};

export default RegoField;
