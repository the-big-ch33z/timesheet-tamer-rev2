
import React from 'react';
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
  if (!field) {
    // Return a default field if it doesn't exist
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
  return 'error' in field ? field.error : undefined;
};

/**
 * Component to render form fields for time entry
 */
const FormFields: React.FC<FormFieldsProps> = ({
  formState,
  onChange,
  disabled = false,
}) => {
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
          onChange={(e) => onChange('hours', e.target.value)}
          placeholder="Enter hours"
          className={cn(hoursError ? 'border-destructive' : '')}
          disabled={disabled}
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
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Enter description"
          className={cn(descriptionError ? 'border-destructive' : '')}
          disabled={disabled}
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
          onChange={(e) => onChange('jobNumber', e.target.value)}
          placeholder="Enter job number"
          className={cn(jobNumberError ? 'border-destructive' : '')}
          disabled={disabled}
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
          onChange={(e) => onChange('taskNumber', e.target.value)}
          placeholder="Enter task number"
          className={cn(taskNumberError ? 'border-destructive' : '')}
          disabled={disabled}
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
          onChange={(e) => onChange('rego', e.target.value)}
          placeholder="Enter registration number"
          className={cn(regoError ? 'border-destructive' : '')}
          disabled={disabled}
        />
        {regoError && <p className="text-sm text-destructive">{regoError}</p>}
      </div>
    </Card>
  );
};

export default FormFields;
