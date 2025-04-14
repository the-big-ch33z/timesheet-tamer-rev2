
import React, { useEffect } from "react";
import { EntryFieldConfig } from "@/types";
import CustomFields from "../fields/CustomFields";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface InlineEntryFormProps {
  visibleFields: EntryFieldConfig[];
  formValues: {
    hours: string;
    description: string;
    jobNumber: string;
    rego: string;
    taskNumber: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onDelete?: () => void;
  entryId?: string;
  disabled?: boolean;
}

const InlineEntryForm: React.FC<InlineEntryFormProps> = ({
  visibleFields,
  formValues,
  onFieldChange,
  onDelete,
  entryId,
  disabled = false
}) => {
  // Enhanced logging with full form values
  console.debug(`[InlineEntryForm] Rendering form with ID: ${entryId || 'new'}`, {
    disabled,
    formValues,
    fieldsCount: visibleFields.length
  });
  
  // Track form values changes
  useEffect(() => {
    console.debug(`[InlineEntryForm] Form values updated for ID: ${entryId || 'new'}`, {
      hours: formValues.hours,
      description: formValues.description ? 
        `${formValues.description.substring(0, 20)}${formValues.description.length > 20 ? '...' : ''}` : '',
      jobNumber: formValues.jobNumber,
      rego: formValues.rego,
      taskNumber: formValues.taskNumber
    });
  }, [formValues, entryId]);

  // Function to handle each field change with enhanced logging
  const handleChange = (field: string, value: string) => {
    console.debug(`[InlineEntryForm] Field '${field}' changing for ID: ${entryId || 'new'}`, {
      from: (formValues as any)[field],
      to: value
    });
    
    // Call the provided change handler
    onFieldChange(field, value);
    
    // Log after handler called
    console.debug(`[InlineEntryForm] Field '${field}' onChange handler called`);
  };

  return (
    <div className={`flex items-center gap-2 bg-white border rounded-md p-2 ${disabled ? 'opacity-75' : ''}`}
         data-entry-id={entryId || 'new'}
         data-disabled={disabled ? 'true' : 'false'}>
      <CustomFields
        visibleFields={visibleFields}
        jobNumber={formValues.jobNumber}
        setJobNumber={(val) => handleChange('jobNumber', val)}
        rego={formValues.rego}
        setRego={(val) => handleChange('rego', val)}
        taskNumber={formValues.taskNumber}
        setTaskNumber={(val) => handleChange('taskNumber', val)}
        description={formValues.description}
        setDescription={(val) => handleChange('description', val)}
        hours={formValues.hours}
        setHours={(val) => handleChange('hours', val)}
        inline={true}
        disabled={disabled}
      />

      {onDelete && entryId && (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={() => {
            console.debug(`[InlineEntryForm] Delete button clicked for ID: ${entryId}`);
            onDelete();
          }}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default InlineEntryForm;
