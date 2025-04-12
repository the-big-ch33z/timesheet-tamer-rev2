import React from "react";
import { EntryFieldConfig } from "@/types";
import JobNumberField from "../field-types/JobNumberField";
import RegoField from "../field-types/RegoField";
import TaskNumberField from "../field-types/TaskNumberField";
import NotesField from "../field-types/NotesField";
import HoursField from "../field-types/HoursField";
import GenericField from "../field-types/GenericField";

interface StandardFieldsGroupProps {
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

const StandardFieldsGroup: React.FC<StandardFieldsGroupProps> = ({
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
  // Filter fields by type for proper grouping
  const jobRegoTaskFields = visibleFields.filter(f => 
    f.visible && ['job number', 'rego', 'task number'].includes(f.name.toLowerCase())
  );
  
  const notesFields = visibleFields.filter(f => 
    f.visible && f.name.toLowerCase() === 'notes'
  );
  
  const hoursFields = visibleFields.filter(f => 
    f.visible && f.name.toLowerCase() === 'hours'
  );
  
  const otherFields = visibleFields.filter(f => 
    f.visible && 
    !['job number', 'rego', 'task number', 'notes', 'hours'].includes(f.name.toLowerCase())
  );

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
            disabled={disabled}
          />
        );
      case 'rego':
        return (
          <RegoField
            id={fieldId}
            value={rego}
            onChange={setRego}
            required={field.required}
            disabled={disabled}
          />
        );
      case 'task number':
        return (
          <TaskNumberField
            id={fieldId}
            value={taskNumber}
            onChange={setTaskNumber}
            required={field.required}
            disabled={disabled}
          />
        );
      case 'notes':
        return (
          <NotesField
            id={fieldId}
            value={description}
            onChange={setDescription}
            required={field.required}
            disabled={disabled}
          />
        );
      case 'hours':
        return (
          <HoursField
            id={fieldId}
            value={hours}
            onChange={setHours}
            required={field.required}
            disabled={disabled}
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
            type={field.type === 'textarea' ? "textarea" : "text"}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Job Number, Rego, and Task Number fields in a grid */}
      {jobRegoTaskFields.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {jobRegoTaskFields.map(field => (
            <div key={field.id}>
              {renderField(field)}
            </div>
          ))}
        </div>
      )}

      {/* Notes field */}
      {notesFields.map(field => (
        <div key={field.id}>
          {renderField(field)}
        </div>
      ))}

      {/* Hours field */}
      {hoursFields.map(field => (
        <div key={field.id}>
          {renderField(field)}
        </div>
      ))}

      {/* Other custom fields */}
      {otherFields.map(field => (
        <div key={field.id}>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
};

export default StandardFieldsGroup;
