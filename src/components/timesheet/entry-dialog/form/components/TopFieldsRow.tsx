
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FormState } from '../types/formTypes';
import { getFieldSafely, getFieldError } from '../utils/formFieldUtils';

interface TopFieldsRowProps {
  formState: FormState;
  handleFieldChange: (fieldName: string, value: string) => void;
  disabled?: boolean;
}

/**
 * Component to render top row of form fields (Hours, Rego, Job Number, Task Number)
 */
const TopFieldsRow: React.FC<TopFieldsRowProps> = ({
  formState,
  handleFieldChange,
  disabled = false,
}) => {
  // Extract fields from formState
  const hoursField = getFieldSafely(formState, 'hours');
  const regoField = getFieldSafely(formState, 'rego');
  const jobNumberField = getFieldSafely(formState, 'jobNumber');
  const taskNumberField = getFieldSafely(formState, 'taskNumber');

  // Get error messages
  const hoursError = getFieldError(formState, 'hours');
  const regoError = getFieldError(formState, 'rego');
  const jobNumberError = getFieldError(formState, 'jobNumber');
  const taskNumberError = getFieldError(formState, 'taskNumber');

  return (
    <div className="flex flex-wrap md:flex-row gap-4 items-start">
      {/* Hours Field - Smallest width */}
      <div className="w-full sm:w-24 flex-shrink-0 space-y-2">
        <Label htmlFor="hours" className={cn(hoursError ? 'text-destructive' : '')}>
          Hours*
        </Label>
        <Input
          id="hours"
          type="text"
          inputMode="decimal"
          value={hoursField.value}
          onChange={(e) => {
            console.debug(`[TopFieldsRow:Input:hours] Input onChange event triggered with value: "${e.target.value}"`);
            handleFieldChange('hours', e.target.value);
          }}
          placeholder="Enter hours"
          className={cn(hoursError ? 'border-destructive' : '')}
          disabled={disabled}
          data-testid="hours-input"
        />
        {hoursError && <p className="text-sm text-destructive">{hoursError}</p>}
      </div>

      {/* Rego Field - Small fixed width */}
      <div className="w-full sm:w-36 flex-shrink-0 space-y-2">
        <Label htmlFor="rego" className={cn(regoError ? 'text-destructive' : '')}>
          Rego
        </Label>
        <Input
          id="rego"
          type="text"
          value={regoField.value}
          onChange={(e) => {
            console.debug(`[TopFieldsRow:Input:rego] Input onChange event triggered with value: "${e.target.value}"`);
            handleFieldChange('rego', e.target.value);
          }}
          placeholder="Enter registration"
          className={cn(regoError ? 'border-destructive' : '')}
          disabled={disabled}
          data-testid="rego-input"
        />
        {regoError && <p className="text-sm text-destructive">{regoError}</p>}
      </div>

      {/* Job Number Field - Medium width */}
      <div className="w-full sm:w-40 flex-shrink-0 space-y-2">
        <Label htmlFor="jobNumber" className={cn(jobNumberError ? 'text-destructive' : '')}>
          Job Number
        </Label>
        <Input
          id="jobNumber"
          type="text"
          value={jobNumberField.value}
          onChange={(e) => {
            console.debug(`[TopFieldsRow:Input:jobNumber] Input onChange event triggered with value: "${e.target.value}"`);
            handleFieldChange('jobNumber', e.target.value);
          }}
          placeholder="Enter job number"
          className={cn(jobNumberError ? 'border-destructive' : '')}
          disabled={disabled}
          data-testid="jobNumber-input"
        />
        {jobNumberError && <p className="text-sm text-destructive">{jobNumberError}</p>}
      </div>

      {/* Task Number Field - Medium width */}
      <div className="w-full sm:w-40 flex-shrink-0 space-y-2">
        <Label htmlFor="taskNumber" className={cn(taskNumberError ? 'text-destructive' : '')}>
          Task Number
        </Label>
        <Input
          id="taskNumber"
          type="text"
          value={taskNumberField.value}
          onChange={(e) => {
            console.debug(`[TopFieldsRow:Input:taskNumber] Input onChange event triggered with value: "${e.target.value}"`);
            handleFieldChange('taskNumber', e.target.value);
          }}
          placeholder="Enter task number"
          className={cn(taskNumberError ? 'border-destructive' : '')}
          disabled={disabled}
          data-testid="taskNumber-input"
        />
        {taskNumberError && <p className="text-sm text-destructive">{taskNumberError}</p>}
      </div>
    </div>
  );
};

export default TopFieldsRow;
