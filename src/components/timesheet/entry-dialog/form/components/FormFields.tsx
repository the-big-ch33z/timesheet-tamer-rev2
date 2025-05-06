
import React from "react";
import HoursField from "../../fields/field-types/HoursField";
import EntryField from "../../fields/EntryField";
import { Textarea } from "@/components/ui/textarea";

const FIELD_TYPES = {
  JOB_NUMBER: "jobNumber",
  TASK_NUMBER: "taskNumber",
  REGO: "rego",
  HOURS: "hours",
  DESCRIPTION: "description"
};

interface FormFieldsProps {
  formState: {
    fields: {
      hours: { value: string; error?: string },
      description: { value: string; error?: string },
      jobNumber: { value: string; error?: string },
      taskNumber: { value: string; error?: string },
      rego: { value: string; error?: string }
    }
  };
  setFieldValue: (field: string, value: string) => void;
}

const renderFormField = (
  fieldType: string, 
  value: string, 
  onChange: (value: string) => void, 
  required = false, 
  error?: string
) => {
  const fieldConfig = {
    [FIELD_TYPES.JOB_NUMBER]: {
      name: "Job Number",
      placeholder: "Job No."
    },
    [FIELD_TYPES.TASK_NUMBER]: {
      name: "Task Number",
      placeholder: "Task No."
    },
    [FIELD_TYPES.REGO]: {
      name: "Rego",
      placeholder: "Rego"
    }
  };
  
  const config = fieldConfig[fieldType];
  if (config) {
    return (
      <div className="w-full">
        <EntryField 
          id={fieldType} 
          name={config.name} 
          value={value} 
          onChange={onChange} 
          placeholder={config.placeholder} 
          required={required} 
          {...(fieldType === FIELD_TYPES.HOURS ? { type: "number", min: "0.25", step: "0.25" } : {})}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
  return null;
};

export const FormFields: React.FC<FormFieldsProps> = ({ formState, setFieldValue }) => {
  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-24">
          <HoursField 
            id="hours" 
            value={formState.fields.hours.value}
            onChange={(value) => {
              let numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                numValue = Math.round(numValue * 4) / 4;
                if (numValue < 0.25) numValue = 0.25;
                if (numValue > 24) numValue = 24;
                value = numValue.toString();
              }
              setFieldValue(FIELD_TYPES.HOURS, value);
            }} 
            required={true} 
          />
          {formState.fields.hours.error && (
            <p className="text-red-500 text-sm mt-1">{formState.fields.hours.error}</p>
          )}
        </div>
        
        <div className="w-full md:w-32">
          {renderFormField(
            FIELD_TYPES.JOB_NUMBER, 
            formState.fields.jobNumber.value, 
            value => setFieldValue(FIELD_TYPES.JOB_NUMBER, value)
          )}
        </div>
        
        <div className="w-full md:w-24">
          {renderFormField(
            FIELD_TYPES.REGO, 
            formState.fields.rego.value, 
            value => setFieldValue(FIELD_TYPES.REGO, value)
          )}
        </div>
        
        <div className="w-full md:w-32">
          {renderFormField(
            FIELD_TYPES.TASK_NUMBER, 
            formState.fields.taskNumber.value, 
            value => setFieldValue(FIELD_TYPES.TASK_NUMBER, value)
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea 
          value={formState.fields.description.value} 
          onChange={e => setFieldValue(FIELD_TYPES.DESCRIPTION, e.target.value)}
          placeholder="Enter description"
          className="w-full"
          rows={2}
        />
      </div>
    </>
  );
};

export default FormFields;
