
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

/**
 * Entry form item component for managing time entries
 * Refactored to use a consistent approach for form fields and validation
 */
const EntryFormItem: React.FC<EntryFormItemProps> = ({
  formState,
  handleFieldChange,
  handleSave,
  onDelete,
  entryId,
  disabled = false
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [localFormState, setLocalFormState] = useState(formState);
  
  // Enhanced logging for component rendering
  console.debug(`[EntryFormItem] Rendering form item for entryId=${entryId}`, {
    disabled,
    formEdited: formState.formEdited,
    hours: formState.hours,
    jobNumber: formState.jobNumber,
    description: formState.description ? 
      `${formState.description.substring(0, 20)}${formState.description.length > 20 ? '...' : ''}` : '',
    rego: formState.rego,
    taskNumber: formState.taskNumber
  });
  
  // Update local state when formState changes
  useEffect(() => {
    setLocalFormState(formState);
  }, [formState]);
  
  // Enhanced field change handler with detailed logging and local state management
  const onFieldChange = (field: string, value: string) => {
    console.debug(`[EntryFormItem] Field change for entry ${entryId}: ${field}=${value}`, {
      disabled,
      currentValue: (localFormState as any)[field]
    });
    
    if (disabled) {
      console.warn(`[EntryFormItem] Ignoring field change because form is disabled: ${entryId}`);
      return;
    }
    
    // Update local state first for immediate UI feedback
    setLocalFormState(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Map field names to match expected state properties
    let stateField = field;
    
    // Normalize field names to match state property names
    if (field.toLowerCase() === 'job number' || field.toLowerCase() === 'job') {
      stateField = 'jobNumber';
    } else if (field.toLowerCase() === 'task number' || field.toLowerCase() === 'task') {
      stateField = 'taskNumber';
    } else if (field.toLowerCase() === 'notes') {
      stateField = 'description';
    }
    
    // Then update parent state
    handleFieldChange(stateField, value);
  };
  
  // Enhanced save handler with loading state
  const onSave = () => {
    console.debug(`[EntryFormItem] Save clicked for entry ${entryId}`, {
      disabled, 
      canSave: !disabled && formState.formEdited
    });
    
    if (disabled) {
      console.warn(`[EntryFormItem] Save prevented - form is disabled: ${entryId}`);
      return;
    }
    
    if (!formState.formEdited) {
      console.warn(`[EntryFormItem] Save skipped - no changes: ${entryId}`);
      return;
    }
    
    setIsSaving(true);
    handleSave();
    
    // Reset saving state after a short delay to show feedback
    setTimeout(() => setIsSaving(false), 500);
  };

  // Check if form has content to determine save button state
  const hasContent = !!(
    localFormState.hours || 
    localFormState.description || 
    localFormState.jobNumber || 
    localFormState.rego || 
    localFormState.taskNumber
  );
  
  const canSave = !disabled && formState.formEdited && hasContent;

  return (
    <div className="bg-white rounded-md shadow p-4 border border-gray-200" 
         data-entry-id={entryId}
         data-disabled={disabled ? 'true' : 'false'}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`job-${entryId}`} className="block text-sm font-medium mb-1">Job Number</label>
            <Input
              id={`job-${entryId}`}
              value={localFormState.jobNumber || ''}
              onChange={(e) => onFieldChange('jobNumber', e.target.value)}
              disabled={disabled}
              placeholder="Job Number"
            />
          </div>
          <div>
            <label htmlFor={`task-${entryId}`} className="block text-sm font-medium mb-1">Task Number</label>
            <Input
              id={`task-${entryId}`}
              value={localFormState.taskNumber || ''}
              onChange={(e) => onFieldChange('taskNumber', e.target.value)}
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
              value={localFormState.rego || ''}
              onChange={(e) => onFieldChange('rego', e.target.value)}
              disabled={disabled}
              placeholder="Rego"
            />
          </div>
          <div>
            <label htmlFor={`hours-${entryId}`} className="block text-sm font-medium mb-1">Hours</label>
            <Input
              id={`hours-${entryId}`}
              value={localFormState.hours || ''}
              onChange={(e) => onFieldChange('hours', e.target.value)}
              disabled={disabled}
              placeholder="Hours"
              type="number"
              step="0.25"
              min="0"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor={`desc-${entryId}`} className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            id={`desc-${entryId}`}
            value={localFormState.description || ''}
            onChange={(e) => onFieldChange('description', e.target.value)}
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
          className={`${canSave ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'} text-white`}
          disabled={disabled || !formState.formEdited || !hasContent || isSaving}
          data-testid={`save-button-${entryId}`}
        >
          {isSaving ? (
            <>
              <Clock className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default EntryFormItem;
