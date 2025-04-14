
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";
import { TimeEntryFormState } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryField from "../../entry-dialog/fields/EntryField";

interface EntryFormItemProps {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string | number) => void;
  handleSave: () => void;
  onDelete: () => void;
  entryId: string;
  disabled?: boolean;
}

const EntryFormItem: React.FC<EntryFormItemProps> = ({
  formState,
  handleFieldChange,
  handleSave,
  onDelete,
  entryId,
  disabled = false
}) => {
  // Helper function for type conversion
  const handleNumberChange = (field: string, value: string) => {
    const numberValue = value === '' ? '' : parseFloat(value) || 0;
    handleFieldChange(field, numberValue);
  };

  return (
    <Card className={`border ${formState.formEdited ? 'border-blue-300' : ''}`} id={`entry-form-${entryId}`}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <EntryField
              id={`hours-${entryId}`}
              name="Hours"
              value={formState.hours.toString()}
              onChange={(value) => handleNumberChange('hours', value)}
              placeholder="Enter hours"
              type="number"
              min="0"
              step="0.1"
              required={true}
              disabled={disabled}
              showLabel={true}
            />
          </div>
          <div>
            <EntryField
              id={`jobNumber-${entryId}`}
              name="Job Number"
              value={formState.jobNumber}
              onChange={(value) => handleFieldChange('jobNumber', value)}
              placeholder="Enter job number"
              disabled={disabled}
              showLabel={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div>
            <EntryField
              id={`rego-${entryId}`}
              name="Rego"
              value={formState.rego}
              onChange={(value) => handleFieldChange('rego', value)}
              placeholder="Enter rego"
              disabled={disabled}
              showLabel={true}
            />
          </div>
          <div>
            <EntryField
              id={`taskNumber-${entryId}`}
              name="Task Number"
              value={formState.taskNumber}
              onChange={(value) => handleFieldChange('taskNumber', value)}
              placeholder="Enter task number"
              disabled={disabled}
              showLabel={true}
            />
          </div>
        </div>
        
        <div className="mt-3">
          <EntryField
            id={`description-${entryId}`}
            name="Description"
            value={formState.description}
            onChange={(value) => handleFieldChange('description', value)}
            placeholder="Enter description"
            type="textarea"
            disabled={disabled}
            showLabel={true}
          />
        </div>
        
        <div className="flex justify-between mt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={disabled || !formState.hours || !formState.formEdited}
            className={formState.formEdited ? "animate-pulse bg-green-600 hover:bg-green-700" : ""}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryFormItem;
