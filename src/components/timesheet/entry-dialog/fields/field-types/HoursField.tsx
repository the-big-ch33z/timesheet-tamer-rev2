
import React from "react";
import EntryField from "../EntryField";

interface HoursFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inline?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

const HoursField: React.FC<HoursFieldProps> = ({
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
      name="Hours"
      value={value}
      onChange={onChange}
      placeholder="Hrs"
      required={required}
      inline={inline}
      type="number"
      disabled={disabled}
      min="0.25"
      max="24"
      step="0.25"
      showLabel={showLabel}
      className={inline ? `w-24 ${className}` : className}
    />
  );
};

export default HoursField;
