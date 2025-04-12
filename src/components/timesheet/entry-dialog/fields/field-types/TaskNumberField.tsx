
import React from "react";
import EntryField from "../EntryField";

interface TaskNumberFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inline?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
}

const TaskNumberField: React.FC<TaskNumberFieldProps> = ({
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
      name="Task Number"
      value={value}
      onChange={onChange}
      placeholder="Task No."
      required={required}
      inline={inline}
      disabled={disabled}
      showLabel={showLabel}
    />
  );
};

export default TaskNumberField;
