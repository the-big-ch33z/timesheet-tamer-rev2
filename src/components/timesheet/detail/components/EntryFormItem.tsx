import React, { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useFormState } from "@/hooks/form/useFormState";
import { useFormSubmission } from "@/hooks/form/useFormSubmission";
import { TimeEntryFormState } from "@/hooks/timesheet/useTimeEntryForm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Loader2, Trash2 } from "lucide-react";

const FIELD_TYPES = {
  HOURS: "hours",
  DESCRIPTION: "description",
  JOB_NUMBER: "jobNumber",
  REGO: "rego",
  TASK_NUMBER: "taskNumber"
};

const VALIDATION_RULES = {
  hours: {
    required: true,
    rules: [
      {
        validate: (value: string) => parseFloat(value) > 0,
        message: "Hours must be greater than 0"
      }
    ]
  }
};

interface EntryFormItemProps {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void;
  onDelete: () => void;
  entryId: string;
  disabled?: boolean;
}

const renderFormField = (
  id: string,
  fieldName: string,
  label: string,
  value: string,
  onChange: (value: string) => void,
  disabled: boolean = false,
  error?: string,
  placeholder: string = ""
) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || label}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const EntryFormItem: React.FC<EntryFormItemProps> = React.memo(({
  formState: initialFormState,
  handleFieldChange: parentHandleFieldChange,
  handleSave,
  onDelete,
  entryId,
  disabled = false
}) => {
  const { formState, setFieldValue, validateForm } = useFormState(`entry-${entryId}`, {
    hours: initialFormState.hours || '',
    description: initialFormState.description || '',
    jobNumber: initialFormState.jobNumber || '',
    rego: initialFormState.rego || '',
    taskNumber: initialFormState.taskNumber || ''
  }, VALIDATION_RULES);

  const { isSubmitting, handleSubmit } = useFormSubmission({
    onSubmit: async () => {
      if (validateForm()) {
        handleSave();
      }
    }
  });

  const handleFieldChangeCallback = useCallback((field: string, value: string) => {
    setFieldValue(field, value);
    parentHandleFieldChange(field, value);
  }, [setFieldValue, parentHandleFieldChange]);

  useEffect(() => {
    if (formState.formEdited) {
      Object.entries(formState.fields).forEach(([field, { value }]) => {
        parentHandleFieldChange(field, value);
      });
    }

    return () => {
      console.debug(`[EntryFormItem] Cleaning up form state for entry ${entryId}`);
    };
  }, [formState.fields, parentHandleFieldChange, entryId, formState.formEdited]);

  const onSaveCallback = useCallback(() => {
    if (!disabled && validateForm()) {
      handleSubmit(formState);
    }
  }, [disabled, validateForm, handleSubmit, formState]);

  return (
    <div 
      className="bg-white rounded-md shadow p-4 border border-gray-200" 
      data-entry-id={entryId}
      data-disabled={disabled ? 'true' : 'false'}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFormField(
            `job-${entryId}`, 
            FIELD_TYPES.JOB_NUMBER,
            "Job Number", 
            formState.fields.jobNumber.value, 
            (value) => handleFieldChangeCallback(FIELD_TYPES.JOB_NUMBER, value),
            disabled,
            formState.fields.jobNumber.error,
            "Job Number"
          )}
          
          {renderFormField(
            `task-${entryId}`, 
            FIELD_TYPES.TASK_NUMBER,
            "Task Number", 
            formState.fields.taskNumber.value, 
            (value) => handleFieldChangeCallback(FIELD_TYPES.TASK_NUMBER, value),
            disabled,
            formState.fields.taskNumber.error,
            "Task Number"
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderFormField(
            `rego-${entryId}`, 
            FIELD_TYPES.REGO,
            "Rego", 
            formState.fields.rego.value, 
            (value) => handleFieldChangeCallback(FIELD_TYPES.REGO, value),
            disabled,
            formState.fields.rego.error,
            "Rego"
          )}
          
          {renderFormField(
            `hours-${entryId}`, 
            FIELD_TYPES.HOURS,
            "Hours", 
            formState.fields.hours.value, 
            (value) => handleFieldChangeCallback(FIELD_TYPES.HOURS, value),
            disabled,
            formState.fields.hours.error,
            "Hours"
          )}
        </div>
        
        <div>
          <label htmlFor={`desc-${entryId}`} className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            id={`desc-${entryId}`}
            value={formState.fields.description.value}
            onChange={(e) => handleFieldChangeCallback(FIELD_TYPES.DESCRIPTION, e.target.value)}
            disabled={disabled}
            placeholder="Entry description"
            rows={2}
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-3">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
          disabled={disabled || isSubmitting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        
        <Button 
          size="sm" 
          onClick={onSaveCallback}
          className={`${formState.isValid ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'} text-white`}
          disabled={disabled || !formState.formEdited || !formState.isValid || isSubmitting}
          data-testid={`save-button-${entryId}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : formState.formEdited ? (
            <>
              <Clock className="h-4 w-4 mr-1" />
              Save Changes
            </>
          ) : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
});

EntryFormItem.displayName = 'EntryFormItem';

export default EntryFormItem;
