
import React from 'react';
import { TimeEntry } from '@/types';
import EntryField from '../../entry-dialog/fields/EntryField';

// Field type constants
const FIELD_TYPES = {
  HOURS: "hours",
  JOB_NUMBER: "jobNumber",
  REGO: "rego",
  TASK_NUMBER: "taskNumber",
  DESCRIPTION: "description"
};

interface EntryFormStepProps {
  values: Partial<TimeEntry>;
  onFieldChange: (field: string, value: string | number) => void;
}

// Reusable field configuration
const FIELD_CONFIG = {
  [FIELD_TYPES.HOURS]: {
    name: "Hours",
    type: "number",
    placeholder: "Enter hours",
    required: true,
    min: "0",
    step: "0.1"
  },
  [FIELD_TYPES.JOB_NUMBER]: {
    name: "Job Number",
    placeholder: "Enter job number"
  },
  [FIELD_TYPES.REGO]: {
    name: "Rego",
    placeholder: "Enter rego"
  },
  [FIELD_TYPES.TASK_NUMBER]: {
    name: "Task Number",
    placeholder: "Enter task number"
  },
  [FIELD_TYPES.DESCRIPTION]: {
    name: "Description",
    placeholder: "Enter description",
    type: "textarea"
  }
};

const EntryFormStep: React.FC<EntryFormStepProps> = ({
  values,
  onFieldChange
}) => {
  // Handle changes for each field with consistent processing
  const handleFieldChange = (field: string, value: string) => {
    console.debug(`[EntryFormStep] Field change: ${field}=${value}`);
    
    // Special handling for numeric fields
    if (field === FIELD_TYPES.HOURS) {
      const numValue = parseFloat(value) || 0;
      onFieldChange(field, numValue);
    } else {
      onFieldChange(field, value);
    }
  };
  
  // Helper to ensure string values for display
  const ensureString = (value: any): string => {
    return value !== undefined && value !== null ? String(value) : '';
  };

  // Render a standard field based on configuration
  const renderField = (fieldType: string) => {
    const config = FIELD_CONFIG[fieldType];
    if (!config) return null;
    
    return (
      <div>
        <EntryField
          id={fieldType}
          name={config.name}
          value={ensureString(values[fieldType])}
          onChange={(value) => handleFieldChange(fieldType, value)}
          placeholder={config.placeholder}
          type={config.type}
          min={config.min}
          step={config.step}
          required={config.required}
          showLabel={true}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField(FIELD_TYPES.HOURS)}
        {renderField(FIELD_TYPES.JOB_NUMBER)}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField(FIELD_TYPES.REGO)}
        {renderField(FIELD_TYPES.TASK_NUMBER)}
      </div>
      
      <div>
        {renderField(FIELD_TYPES.DESCRIPTION)}
      </div>
    </div>
  );
};

export default EntryFormStep;
