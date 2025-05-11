
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { FormFieldsProps } from '../types/formTypes';
import TopFieldsRow from './TopFieldsRow';
import DescriptionField from './DescriptionField';

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
  
  // Handle field change
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
    <Card className="p-4">
      <div className="space-y-4">
        {/* First row with Hours, Rego, Job Number, Task Number */}
        <TopFieldsRow 
          formState={formState} 
          handleFieldChange={handleFieldChange} 
          disabled={disabled} 
        />

        {/* Second row with Description field */}
        <DescriptionField
          formState={formState}
          handleFieldChange={handleFieldChange}
          disabled={disabled}
        />
      </div>
    </Card>
  );
};

export default FormFields;
