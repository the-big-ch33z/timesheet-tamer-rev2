
import React from "react";
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
  // Function to handle each field change
  const handleChange = (field: string, value: string) => {
    console.log(`Field changed: ${field} = ${value}`);
    onFieldChange(field, value);
  };

  return (
    <div className={`flex items-center gap-2 bg-white border rounded-md p-2 ${disabled ? 'opacity-75' : ''}`}>
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
          onClick={onDelete}
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
