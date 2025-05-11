
import React from "react";
import HoursField from "../../fields/field-types/HoursField";
import EntryField from "../../fields/EntryField";
import { Textarea } from "@/components/ui/textarea";
import { FormState } from "@/contexts/form/types";

const FIELD_TYPES = {
  JOB_NUMBER: "jobNumber",
  TASK_NUMBER: "taskNumber",
  REGO: "rego",
  HOURS: "hours",
  DESCRIPTION: "description"
};

interface FormFieldsProps {
  formState: FormState;
  setFieldValue: (field: string, value: string) => void;
}

const renderFormField = (
  fieldType: string, 
  formField: { value: any, error?: string }, 
  onChange: (value: string) => void, 
  required = false
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
          value={formField.value} 
          onChange={onChange} 
          placeholder={config.placeholder} 
          required={required} 
          {...(fieldType === FIELD_TYPES.HOURS ? { type: "number", min: "0.25", step: "0.25" } : {})}
        />
        {formField.error && <p className="text-red-500 text-sm mt-1">{formField.error}</p>}
      </div>
    );
  }
  return null;
};

export const FormFields: React.FC<FormFieldsProps> = ({ formState, setFieldValue }) => {
  // Extract the fields from formState or provide fallbacks for safety
  // Use type assertion for safe access to error property
  const getFieldWithError = (fieldName: string) => {
    const field = formState.fields[fieldName] || { value: '', touched: false };
    return {
      value: field.value ?? '',
      error: 'error' in field ? field.error : undefined,
      touched: 'touched' in field ? field.touched : false
    };
  };

  const hoursField = getFieldWithError(FIELD_TYPES.HOURS);
  const descriptionField = getFieldWithError(FIELD_TYPES.DESCRIPTION);
  const jobNumberField = getFieldWithError(FIELD_TYPES.JOB_NUMBER);
  const regoField = getFieldWithError(FIELD_TYPES.REGO);
  const taskNumberField = getFieldWithError(FIELD_TYPES.TASK_NUMBER);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-24">
          <HoursField 
            id="hours" 
            value={hoursField.value}
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
          {hoursField.error && (
            <p className="text-red-500 text-sm mt-1">{hoursField.error}</p>
          )}
        </div>
        
        <div className="w-full md:w-32">
          {renderFormField(
            FIELD_TYPES.JOB_NUMBER, 
            jobNumberField, 
            value => setFieldValue(FIELD_TYPES.JOB_NUMBER, value)
          )}
        </div>
        
        <div className="w-full md:w-24">
          {renderFormField(
            FIELD_TYPES.REGO, 
            regoField, 
            value => setFieldValue(FIELD_TYPES.REGO, value)
          )}
        </div>
        
        <div className="w-full md:w-32">
          {renderFormField(
            FIELD_TYPES.TASK_NUMBER, 
            taskNumberField, 
            value => setFieldValue(FIELD_TYPES.TASK_NUMBER, value)
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea 
          value={descriptionField.value} 
          onChange={e => setFieldValue(FIELD_TYPES.DESCRIPTION, e.target.value)}
          placeholder="Enter description"
          className="w-full"
          rows={2}
        />
        {descriptionField.error && (
          <p className="text-red-500 text-sm mt-1">{descriptionField.error}</p>
        )}
      </div>
    </>
  );
};

export default FormFields;
