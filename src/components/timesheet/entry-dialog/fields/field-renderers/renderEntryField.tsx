
import React from "react";
import { EntryFieldConfig } from "@/types";
import JobNumberField from "../field-types/JobNumberField";
import RegoField from "../field-types/RegoField";
import TaskNumberField from "../field-types/TaskNumberField";
import NotesField from "../field-types/NotesField";
import HoursField from "../field-types/HoursField";
import GenericField from "../field-types/GenericField";

interface RenderEntryFieldProps {
  field: EntryFieldConfig;
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
  disabled?: boolean;
  inline?: boolean;
  showLabel?: boolean;
}

export const renderEntryField = ({
  field,
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
  disabled = false,
  inline = false,
  showLabel = true
}: RenderEntryFieldProps) => {
  const fieldId = field.id;
  
  switch (field.name.toLowerCase()) {
    case 'job number':
      return (
        <JobNumberField
          id={fieldId}
          value={jobNumber}
          onChange={setJobNumber}
          required={field.required}
          inline={inline}
          disabled={disabled}
          showLabel={showLabel}
        />
      );
    case 'rego':
      return (
        <RegoField
          id={fieldId}
          value={rego}
          onChange={setRego}
          required={field.required}
          inline={inline}
          disabled={disabled}
          showLabel={showLabel}
        />
      );
    case 'task number':
      return (
        <TaskNumberField
          id={fieldId}
          value={taskNumber}
          onChange={setTaskNumber}
          required={field.required}
          inline={inline}
          disabled={disabled}
          showLabel={showLabel}
        />
      );
    case 'notes':
      return (
        <NotesField
          id={fieldId}
          value={description}
          onChange={setDescription}
          required={field.required}
          inline={inline}
          disabled={disabled}
          showLabel={showLabel}
        />
      );
    case 'hours':
      return (
        <HoursField
          id={fieldId}
          value={hours}
          onChange={setHours}
          required={field.required}
          inline={inline}
          disabled={disabled}
          showLabel={showLabel}
        />
      );
    default:
      if (!field.name) return null;
      
      return (
        <GenericField
          id={fieldId}
          name={field.name}
          value=""
          onChange={() => {}}
          placeholder={field.placeholder || ""}
          required={field.required}
          inline={inline}
          disabled={disabled}
          showLabel={showLabel}
          type={field.type === 'textarea' ? "textarea" : "text"}
        />
      );
  }
};
