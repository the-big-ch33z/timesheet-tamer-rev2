
import React from "react";
import { EntryFieldConfig } from "@/types";
import InlineFieldsGroup from "./field-groups/InlineFieldsGroup";
import StandardFieldsGroup from "./field-groups/StandardFieldsGroup";

interface CustomFieldsProps {
  visibleFields: EntryFieldConfig[];
  jobNumber: string;
  setJobNumber: (value: string) => void;
  rego: string;
  setRego: (value: string) => void;
  taskNumber: string;
  setTaskNumber: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  hours: string;
  setHours: (value: string) => void;
  inline?: boolean;
  disabled?: boolean;
}

const CustomFields: React.FC<CustomFieldsProps> = ({
  visibleFields,
  jobNumber,
  setJobNumber,
  rego,
  setRego,
  taskNumber,
  setTaskNumber,
  description,
  setDescription,
  hours,
  setHours,
  inline = false,
  disabled = false,
}) => {
  if (inline) {
    return (
      <InlineFieldsGroup
        visibleFields={visibleFields}
        jobNumber={jobNumber}
        setJobNumber={setJobNumber}
        rego={rego}
        setRego={setRego}
        taskNumber={taskNumber}
        setTaskNumber={setTaskNumber}
        description={description}
        setDescription={setDescription}
        hours={hours}
        setHours={setHours}
        disabled={disabled}
      />
    );
  }

  return (
    <StandardFieldsGroup
      visibleFields={visibleFields}
      jobNumber={jobNumber}
      setJobNumber={setJobNumber}
      rego={rego}
      setRego={setRego}
      taskNumber={taskNumber}
      setTaskNumber={setTaskNumber}
      description={description}
      setDescription={setDescription}
      hours={hours}
      setHours={setHours}
      disabled={disabled}
    />
  );
};

export default CustomFields;
