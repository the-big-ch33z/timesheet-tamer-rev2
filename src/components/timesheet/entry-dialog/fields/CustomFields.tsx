import React from "react";
import { EntryFieldConfig } from "@/types";
import EntryField from "./EntryField";

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
  // Render specific field based on field type and name
  const renderField = (field: EntryFieldConfig) => {
    const fieldId = field.id;
    
    switch (field.name.toLowerCase()) {
      case 'job number':
        return (
          <EntryField
            id={fieldId}
            name={field.name}
            value={jobNumber}
            onChange={setJobNumber}
            placeholder={field.placeholder || "Job No."}
            required={field.required}
            inline={inline}
            disabled={disabled}
            showLabel={!inline}
          />
        );
      case 'rego':
        return (
          <EntryField
            id={fieldId}
            name={field.name}
            value={rego}
            onChange={setRego}
            placeholder={field.placeholder || "Rego"}
            required={field.required}
            inline={inline}
            disabled={disabled}
            showLabel={!inline}
          />
        );
      case 'task number':
        return (
          <EntryField
            id={fieldId}
            name={field.name}
            value={taskNumber}
            onChange={setTaskNumber}
            placeholder={field.placeholder || "Task No."}
            required={field.required}
            inline={inline}
            disabled={disabled}
            showLabel={!inline}
          />
        );
      case 'notes':
        return (
          <EntryField
            id={fieldId}
            name={field.name}
            value={description}
            onChange={setDescription}
            placeholder={field.placeholder || "Notes"}
            required={field.required}
            inline={inline}
            type={inline ? "text" : "textarea"}
            disabled={disabled}
            showLabel={!inline}
            className={inline ? "flex-1 min-w-40" : ""}
          />
        );
      case 'hours':
        return (
          <EntryField
            id={fieldId}
            name={field.name}
            value={hours}
            onChange={setHours}
            placeholder={field.placeholder || "Hrs"}
            required={field.required}
            inline={inline}
            type="number"
            disabled={disabled}
            min="0.25"
            max="24"
            step="0.25"
            showLabel={!inline}
            className={inline ? "w-24" : ""}
          />
        );
      default:
        if (!field.name) return null;
        
        return (
          <EntryField
            id={fieldId}
            name={field.name}
            value=""
            onChange={() => {}}
            placeholder={field.placeholder || ""}
            required={field.required}
            inline={inline}
            type={field.type === 'textarea' ? "textarea" : "text"}
            disabled={disabled}
            showLabel={!inline}
          />
        );
    }
  };

  if (inline) {
    return (
      <div className="flex gap-2 flex-grow">
        {visibleFields.map(field => field.visible && (
          <React.Fragment key={field.id}>
            {renderField(field)}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Job Number, Rego, and Task Number fields in a grid */}
      <div className="grid grid-cols-2 gap-4">
        {visibleFields.filter(f => 
          f.visible && ['job number', 'rego', 'task number'].includes(f.name.toLowerCase())
        ).map(field => (
          <div key={field.id}>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Notes field */}
      {visibleFields.filter(f => f.visible && f.name.toLowerCase() === 'notes').map(field => (
        <div key={field.id}>
          {renderField(field)}
        </div>
      ))}

      {/* Hours field */}
      {visibleFields.filter(f => f.visible && f.name.toLowerCase() === 'hours').map(field => (
        <div key={field.id}>
          {renderField(field)}
        </div>
      ))}

      {/* Other custom fields */}
      {visibleFields.filter(f => 
        f.visible && !['job number', 'rego', 'task number', 'notes', 'hours', ''].includes(f.name.toLowerCase())
      ).map(field => (
        <div key={field.id}>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
};

export default CustomFields;
