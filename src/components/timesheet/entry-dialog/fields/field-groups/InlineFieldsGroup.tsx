
import React from "react";
import { EntryFieldConfig } from "@/types";
import JobNumberField from "../field-types/JobNumberField";
import RegoField from "../field-types/RegoField";
import TaskNumberField from "../field-types/TaskNumberField";
import NotesField from "../field-types/NotesField";
import HoursField from "../field-types/HoursField";
import GenericField from "../field-types/GenericField";

interface InlineFieldsGroupProps {
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
  disabled?: boolean;
}

const InlineFieldsGroup: React.FC<InlineFieldsGroupProps> = ({
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
  disabled = false,
}) => {
  // Render specific field based on field type and name
  const renderField = (field: EntryFieldConfig) => {
    const fieldId = field.id;
    
    switch (field.name.toLowerCase()) {
      case 'job number':
        return (
          <JobNumberField
            id={fieldId}
            value={jobNumber}
            onChange={setJobNumber}
            required={field.required}
            inline={true}
            disabled={disabled}
            showLabel={false}
          />
        );
      case 'rego':
        return (
          <RegoField
            id={fieldId}
            value={rego}
            onChange={setRego}
            required={field.required}
            inline={true}
            disabled={disabled}
            showLabel={false}
          />
        );
      case 'task number':
        return (
          <TaskNumberField
            id={fieldId}
            value={taskNumber}
            onChange={setTaskNumber}
            required={field.required}
            inline={true}
            disabled={disabled}
            showLabel={false}
          />
        );
      case 'notes':
        return (
          <NotesField
            id={fieldId}
            value={description}
            onChange={setDescription}
            required={field.required}
            inline={true}
            disabled={disabled}
            showLabel={false}
          />
        );
      case 'hours':
        return (
          <HoursField
            id={fieldId}
            value={hours}
            onChange={setHours}
            required={field.required}
            inline={true}
            disabled={disabled}
            showLabel={false}
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
            inline={true}
            disabled={disabled}
            showLabel={false}
          />
        );
    }
  };

  return (
    <div className="flex gap-2 flex-grow">
      {visibleFields.map(field => {
        if (!field.visible) return null;
        
        return (
          <React.Fragment key={field.id}>
            {renderField(field)}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default InlineFieldsGroup;
