
import React from 'react';
import { TimeEntry } from '@/types';
import EntryField, { EntryFieldType } from '../../entry-dialog/fields/EntryField';

// Field type constants
const FIELD_TYPES = {
  HOURS: "hours",
  JOB_NUMBER: "jobNumber",
  REGO: "rego",
  TASK_NUMBER: "taskNumber",
  DESCRIPTION: "description"
};

// Updated: use step 0.25 and min 0.25 for hours!
const FIELD_CONFIG = {
  [FIELD_TYPES.HOURS]: {
    name: "Hours",
    type: "number" as EntryFieldType,
    placeholder: "Enter hours",
    required: true,
    min: "0.25",
    step: "0.25"
  },
  [FIELD_TYPES.JOB_NUMBER]: {
    name: "Job Number",
    placeholder: "Enter job number",
    type: "text" as EntryFieldType
  },
  [FIELD_TYPES.REGO]: {
    name: "Rego",
    placeholder: "Enter rego",
    type: "text" as EntryFieldType
  },
  [FIELD_TYPES.TASK_NUMBER]: {
    name: "Task Number",
    placeholder: "Enter task number",
    type: "text" as EntryFieldType
  },
  [FIELD_TYPES.DESCRIPTION]: {
    name: "Description",
    placeholder: "Enter description",
    type: "textarea" as EntryFieldType
  }
};

const EntryFormStep: React.FC<any> = ({
  values,
  onFieldChange
}) => {
  const handleFieldChange = (field: string, value: string) => {
    if (field === FIELD_TYPES.HOURS) {
      // Snap to quarter hour
      const parsed = parseFloat(value) || 0;
      const snapped = Math.round(parsed * 4) / 4;
      onFieldChange(field, snapped);
    } else {
      onFieldChange(field, value);
    }
  };

  const ensureString = (value: any): string => {
    return value !== undefined && value !== null ? String(value) : '';
  };

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

