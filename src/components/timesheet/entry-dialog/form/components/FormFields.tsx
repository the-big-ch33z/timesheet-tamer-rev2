
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FormFieldsProps = {
  formState: FormState;
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
};

// Define the FormState type locally since it's not exported from useFormState
interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isDirty: boolean;
  formEdited: boolean;
}

interface FormField {
  name?: string;
  value: string;
  touched: boolean;
  required?: boolean;
  error?: string;
}

/**
 * Safely access properties from a form field
 * This handles potential undefined fields and provides type safety
 */
const getFieldSafely = (formState: FormState, fieldName: string): FormField => {
  const field = formState.fields[fieldName];
  console.debug(`[FormFields:getFieldSafely] Accessing field "${fieldName}":`, field);
  if (!field) {
    // Return a default field if it doesn't exist
    console.warn(`[FormFields:getFieldSafely] Field "${fieldName}" not found in formState`);
    return { value: '', touched: false };
  }
  return field;
};

/**
 * Safely get a field's error message
 */
const getFieldError = (formState: FormState, fieldName: string): string | undefined => {
  const field = formState.fields[fieldName];
  if (!field) return undefined;
  return field.error;
};

/**
 * Component to render form fields for time entry
 */
const FormFields: React.FC<FormFieldsProps> = ({
  formState,
  onChange,
  disabled = false,
}) => {
  console.debug('[FormFields] Rendering with formState:', formState);
  console.debug('[FormFields] Disabled state:', disabled);
  console.debug('[FormFields] onChange function reference:', !!onChange);
  
  // Extract fields from formState
  const hoursField = getFieldSafely(formState, 'hours');
  const descriptionField = getFieldSafely(formState, 'description');
  const jobNumberField = getFieldSafely(formState, 'jobNumber');
  const taskNumberField = getFieldSafely(formState, 'taskNumber');
  const regoField = getFieldSafely(formState, 'rego');

  // Get error messages
  const hoursError = getFieldError(formState, 'hours');
  const descriptionError = getFieldError(formState, 'description');
  const jobNumberError = getFieldError(formState, 'jobNumber');
  const taskNumberError = getFieldError(formState, 'taskNumber');
  const regoError = getFieldError(formState, 'rego');

  // Add effect to log field values whenever they change
  useEffect(() => {
    console.debug('[FormFields:useEffect] Field values updated:', {
      hours: hoursField.value,
      description: descriptionField.value,
      jobNumber: jobNumberField.value,
      taskNumber: taskNumberField.value,
      rego: regoField.value
    });
  }, [hoursField.value, descriptionField.value, jobNumberField.value, taskNumberField.value, regoField.value]);

  const handleFieldChange = (fieldName: string, value: string) => {
    console.debug(`[FormFields:handleFieldChange] START: Field "${fieldName}" changing to "${value}"`);
    
    // Log the onChange function availability 
    if (!onChange) {
      console.error(`[FormFields:handleFieldChange] onChange handler is ${onChange === undefined ? 'undefined' : 'null'}`);
      return;
    }
    
    try {
      onChange(fieldName, value);
      console.debug(`[FormFields:handleFieldChange] Called onChange for "${fieldName}" with value "${value}"`);
    } catch (error) {
      console.error(`[FormFields:handleFieldChange] ERROR calling onChange for "${fieldName}":`, error);
    }
  };

  // Add log to check if component gets re-rendered with disabled prop
  useEffect(() => {
    console.debug(`[FormFields:useEffect] Disabled prop changed to: ${disabled}`);
  }, [disabled]);

  return (
    <Card className="p-4 space-y-4">
      {/* Hours Field */}
      <div className="space-y-2">
        <Label htmlFor="hours" className={cn(hoursError ? 'text-destructive' : '')}>
          Hours*
        </Label>
        <Input
          id="hours"
          type="text"
          inputMode="decimal"
          value={hoursField.value}
          onChange={(e) => {
            console.debug(`[FormFields:Input:hours] Input onChange event triggered with value: "${e.target.value}"`);
            handleFieldChange('hours', e.target.value);
          }}
          onFocus={() => console.debug('[FormFields:Input:hours] Input focused')}
          onBlur={() => console.debug(`[FormFields:Input:hours] Input blurred with value: "${hoursField.value}"`)}
          placeholder="Enter hours"
          className={cn(hoursError ? 'border-destructive' : '')}
          disabled={disabled}
          data-testid="hours-input"
        />
        {hoursError && <p className="text-sm text-destructive">{hoursError}</p>}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description" className={cn(descriptionError ? 'text-destructive' : '')}>
          Description*
        </Label>
        <Textarea
          id="description"
          value={descriptionField.value}
          onChange={(e) => {
            console.debug(`[FormFields:Textarea:description] Textarea onChange event triggered with value: "${e.target.value}"`);
            handleFieldChange('description', e.target.value);
          }}
          onFocus={() => console.debug('[FormFields:Textarea:description] Textarea focused')}
          onBlur={() => console.debug(`[FormFields:Textarea:description] Textarea blurred with value: "${descriptionField.value}"`)}
          placeholder="Enter description"
          className={cn(descriptionError ? 'border-destructive' : '')}
          disabled={disabled}
          data-testid="description-input"
        />
        {descriptionError && <p className="text-sm text-destructive">{descriptionError}</p>}
      </div>

      {/* Job Number Field */}
      <div className="space-y-2">
        <Label htmlFor="jobNumber" className={cn(jobNumberError ? 'text-destructive' : '')}>
          Job Number
        </Label>
        <Input
          id="jobNumber"
          type="text"
          value={jobNumberField.value}
          onChange={(e) => {
            console.debug(`[FormFields:Input:jobNumber] Input onChange event triggered with value: "${e.target.value}"`);
            handleFieldChange('jobNumber', e.target.value);
          }}
          onFocus={() => console.debug('[FormFields:Input:jobNumber] Input focused')}
          onBlur={() => console.debug(`[FormFields:Input:jobNumber] Input blurred with value: "${jobNumberField.value}"`)}
          placeholder="Enter job number"
          className={cn(jobNumberError ? 'border-destructive' : '')}
          disabled={disabled}
          data-testid="jobNumber-input"
        />
        {jobNumberError && <p className="text-sm text-destructive">{jobNumberError}</p>}
      </div>

      {/* Task Number Field */}
      <div className="space-y-2">
        <Label htmlFor="taskNumber" className={cn(taskNumberError ? 'text-destructive' : '')}>
          Task Number
        </Label>
        <Input
          id="taskNumber"
          type="text"
          value={taskNumberField.value}
          onChange={(e) => {
            console.debug(`[FormFields:Input:taskNumber] Input onChange event triggered with value: "${e.target.value}"`);
            handleFieldChange('taskNumber', e.target.value);
          }}
          onFocus={() => console.debug('[FormFields:Input:taskNumber] Input focused')}
          onBlur={() => console.debug(`[FormFields:Input:taskNumber] Input blurred with value: "${taskNumberField.value}"`)}
          placeholder="Enter task number"
          className={cn(taskNumberError ? 'border-destructive' : '')}
          disabled={disabled}
          data-testid="taskNumber-input"
        />
        {taskNumberError && <p className="text-sm text-destructive">{taskNumberError}</p>}
      </div>

      {/* Registration Number Field */}
      <div className="space-y-2">
        <Label htmlFor="rego" className={cn(regoError ? 'text-destructive' : '')}>
          Registration Number
        </Label>
        <Input
          id="rego"
          type="text"
          value={regoField.value}
          onChange={(e) => {
            console.debug(`[FormFields:Input:rego] Input onChange event triggered with value: "${e.target.value}"`);
            handleFieldChange('rego', e.target.value);
          }}
          onFocus={() => console.debug('[FormFields:Input:rego] Input focused')}
          onBlur={() => console.debug(`[FormFields:Input:rego] Input blurred with value: "${regoField.value}"`)}
          placeholder="Enter registration number"
          className={cn(regoError ? 'border-destructive' : '')}
          disabled={disabled}
          data-testid="rego-input"
        />
        {regoError && <p className="text-sm text-destructive">{regoError}</p>}
      </div>
    </Card>
  );
};

export default FormFields;
