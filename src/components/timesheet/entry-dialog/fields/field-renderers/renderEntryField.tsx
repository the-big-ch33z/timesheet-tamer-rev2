
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
  key?: string; // Accept key prop but don't use it directly (will be handled by React)
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
  showLabel = true,
}: RenderEntryFieldProps) => {
  const fieldId = field.id;
  const fieldNameLower = field.name.toLowerCase().trim();
  
  // Add debug logging to help identify field name matching issues
  console.debug(`[renderEntryField] Rendering field: ${field.name} (normalized: ${fieldNameLower})`);
  
  switch (fieldNameLower) {
    case 'job number':
    case 'job':
    case 'jobnumber':
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
    case 'task':
    case 'tasknumber':
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
    case 'description':
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
    case 'hour':
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
      console.warn(`[renderEntryField] Unrecognized field type: "${field.name}" (normalized: "${fieldNameLower}"). Falling back to generic field.`);
      
      if (!field.name) return null;
      
      // Attempt to infer field type based on name if not matching the above cases
      let inferredHandler = () => {};
      let inferredValue = "";
      
      if (fieldNameLower.includes('job')) {
        inferredHandler = setJobNumber;
        inferredValue = jobNumber;
        console.debug(`[renderEntryField] Inferred job number field from name: ${field.name}`);
      } else if (fieldNameLower.includes('rego')) {
        inferredHandler = setRego;
        inferredValue = rego;
        console.debug(`[renderEntryField] Inferred rego field from name: ${field.name}`);
      } else if (fieldNameLower.includes('task')) {
        inferredHandler = setTaskNumber;
        inferredValue = taskNumber;
        console.debug(`[renderEntryField] Inferred task number field from name: ${field.name}`);
      } else if (fieldNameLower.includes('note') || fieldNameLower.includes('desc')) {
        inferredHandler = setDescription;
        inferredValue = description;
        console.debug(`[renderEntryField] Inferred description field from name: ${field.name}`);
      } else if (fieldNameLower.includes('hour')) {
        inferredHandler = setHours;
        inferredValue = hours;
        console.debug(`[renderEntryField] Inferred hours field from name: ${field.name}`);
      }
      
      return (
        <GenericField
          id={fieldId}
          name={field.name}
          value={inferredValue}
          onChange={inferredHandler}
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

