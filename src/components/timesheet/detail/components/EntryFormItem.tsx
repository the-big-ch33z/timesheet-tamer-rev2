
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFormState } from "@/hooks/form/useFormState";
import { TimeEntryFormState } from "@/hooks/timesheet/useTimeEntryForm";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Trash2 } from "lucide-react";

interface EntryFormItemProps {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void;
  onDelete: () => void;
  entryId: string;
  disabled?: boolean;
}

const EntryFormItem: React.FC<EntryFormItemProps> = ({
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
  });

  useEffect(() => {
    if (formState.formEdited) {
      Object.entries(formState.fields).forEach(([field, { value }]) => {
        parentHandleFieldChange(field, value);
      });
    }
  }, [formState.fields, parentHandleFieldChange]);

  const onSave = () => {
    if (!disabled && validateForm()) {
      handleSave();
    }
  };

  return (
    <div 
      className="bg-white rounded-md shadow p-4 border border-gray-200" 
      data-entry-id={entryId}
      data-disabled={disabled ? 'true' : 'false'}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`job-${entryId}`} className="block text-sm font-medium mb-1">Job Number</label>
            <Input
              id={`job-${entryId}`}
              value={formState.fields.jobNumber.value}
              onChange={(e) => setFieldValue('jobNumber', e.target.value)}
              disabled={disabled}
              placeholder="Job Number"
            />
          </div>
          <div>
            <label htmlFor={`task-${entryId}`} className="block text-sm font-medium mb-1">Task Number</label>
            <Input
              id={`task-${entryId}`}
              value={formState.fields.taskNumber.value}
              onChange={(e) => setFieldValue('taskNumber', e.target.value)}
              disabled={disabled}
              placeholder="Task Number"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor={`rego-${entryId}`} className="block text-sm font-medium mb-1">Rego</label>
            <Input
              id={`rego-${entryId}`}
              value={formState.fields.rego.value}
              onChange={(e) => setFieldValue('rego', e.target.value)}
              disabled={disabled}
              placeholder="Rego"
            />
          </div>
          <div>
            <label htmlFor={`hours-${entryId}`} className="block text-sm font-medium mb-1">Hours</label>
            <Input
              id={`hours-${entryId}`}
              value={formState.fields.hours.value}
              onChange={(e) => setFieldValue('hours', e.target.value)}
              disabled={disabled}
              placeholder="Hours"
              type="number"
              step="0.25"
              min="0"
              required
            />
            {formState.fields.hours.error && (
              <p className="text-red-500 text-xs mt-1">{formState.fields.hours.error}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor={`desc-${entryId}`} className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            id={`desc-${entryId}`}
            value={formState.fields.description.value}
            onChange={(e) => setFieldValue('description', e.target.value)}
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
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        
        <Button 
          size="sm" 
          onClick={onSave}
          className={`${formState.isValid ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'} text-white`}
          disabled={disabled || !formState.formEdited || !formState.isValid}
          data-testid={`save-button-${entryId}`}
        >
          {formState.formEdited ? (
            <>
              <Clock className="h-4 w-4 mr-1" />
              Save Changes
            </>
          ) : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default EntryFormItem;
