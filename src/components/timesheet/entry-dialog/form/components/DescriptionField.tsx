
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FormState } from '../types/formTypes';
import { getFieldSafely, getFieldError } from '../utils/formFieldUtils';

interface DescriptionFieldProps {
  formState: FormState;
  handleFieldChange: (fieldName: string, value: string) => void;
  disabled?: boolean;
}

/**
 * Component to render the Description field
 */
const DescriptionField: React.FC<DescriptionFieldProps> = ({
  formState,
  handleFieldChange,
  disabled = false,
}) => {
  // Extract description field from formState
  const descriptionField = getFieldSafely(formState, 'description');
  const descriptionError = getFieldError(formState, 'description');

  return (
    <div className="w-full space-y-2">
      <Label htmlFor="description" className={cn(descriptionError ? 'text-destructive' : '')}>
        Description
      </Label>
      <Textarea
        id="description"
        value={descriptionField.value}
        onChange={(e) => {
          console.debug(`[DescriptionField:Textarea] Textarea onChange event triggered with value: "${e.target.value}"`);
          handleFieldChange('description', e.target.value);
        }}
        placeholder="Enter description"
        className={cn(descriptionError ? 'border-destructive' : '', "min-h-[60px] resize-y")}
        disabled={disabled}
        data-testid="description-input"
        rows={2}
      />
      {descriptionError && <p className="text-sm text-destructive">{descriptionError}</p>}
    </div>
  );
};

export default DescriptionField;
