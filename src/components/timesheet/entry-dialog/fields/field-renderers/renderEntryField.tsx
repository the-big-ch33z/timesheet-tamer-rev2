import React from "react";
import { EntryFieldConfig } from "@/types";
import JobNumberField from "../field-types/JobNumberField";
import RegoField from "../field-types/RegoField";
import TaskNumberField from "../field-types/TaskNumberField";
import NotesField from "../field-types/NotesField";
import HoursField from "../field-types/HoursField";
import GenericField from "../field-types/GenericField";

// Define a consistent type for field handlers
type FieldHandler = (value: string) => void;

// Define type for field value-handler pairs
interface FieldPair {
  value: string;
  handler: FieldHandler;
}

interface RenderEntryFieldProps {
  field: EntryFieldConfig;
  jobNumber: string;
  setJobNumber: FieldHandler;
  rego: string;
  setRego: FieldHandler;
  taskNumber: string;
  setTaskNumber: FieldHandler;
  description: string;
  setDescription: FieldHandler;
  hours: string;
  setHours: FieldHandler;
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
      // Initialize with a properly typed default handler
      let fieldPair: FieldPair = {
        value: "",
        handler: (value: string) => {
          console.debug(`[renderEntryField] Default handler called with: ${value}`);
        }
      };
      
      // Infer the correct handler and value based on field name
      if (fieldNameLower.includes('job')) {
        fieldPair = { value: jobNumber, handler: setJobNumber };
        console.debug(`[renderEntryField] Inferred job number field from name: ${field.name}`);
      } else if (fieldNameLower.includes('rego')) {
        fieldPair = { value: rego, handler: setRego };
        console.debug(`[renderEntryField] Inferred rego field from name: ${field.name}`);
      } else if (fieldNameLower.includes('task')) {
        fieldPair = { value: taskNumber, handler: setTaskNumber };
        console.debug(`[renderEntryField] Inferred task number field from name: ${field.name}`);
      } else if (fieldNameLower.includes('note') || fieldNameLower.includes('desc')) {
        fieldPair = { value: description, handler: setDescription };
        console.debug(`[renderEntryField] Inferred description field from name: ${field.name}`);
      } else if (fieldNameLower.includes('hour')) {
        fieldPair = { value: hours, handler: setHours };
        console.debug(`[renderEntryField] Inferred hours field from name: ${field.name}`);
      }
      
      let fieldType: EntryFieldType = "text";
      if (field.type === "textarea") {
        fieldType = "textarea";
      } else {
        fieldType = field.type as EntryFieldType;
      }
      
      return (
        <GenericField
          id={fieldId}
          name={field.name}
          value={fieldPair.value}
          onChange={fieldPair.handler}
          placeholder={field.placeholder || ""}
          required={field.required}
          inline={inline}
          disabled={disabled}
          showLabel={showLabel}
          type={fieldType}
        />
      );
  }
};
