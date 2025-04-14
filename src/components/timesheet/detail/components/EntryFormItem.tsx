
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import InlineEntryForm from "../../entry-dialog/form/InlineEntryForm";
import { TimeEntryFormState } from "@/hooks/timesheet/useTimeEntryForm";

interface EntryFormItemProps {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
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
  const [isSaving, setIsSaving] = useState(false);
  
  // Enhanced logging for component rendering
  console.debug(`[EntryFormItem] Rendering form item for entryId=${entryId}`, {
    disabled,
    formEdited: formState.formEdited,
    hours: formState.hours,
    description: formState.description ? 
      `${formState.description.substring(0, 20)}${formState.description.length > 20 ? '...' : ''}` : '',
    jobNumber: formState.jobNumber,
    rego: formState.rego,
    taskNumber: formState.taskNumber
  });
  
  // Track when disabled prop changes
  useEffect(() => {
    console.debug(`[EntryFormItem] Disabled state changed for entry ${entryId}: ${disabled}`);
  }, [disabled, entryId]);
  
  // Track when form edited state changes
  useEffect(() => {
    console.debug(`[EntryFormItem] Form edited state changed for entry ${entryId}: ${formState.formEdited}`);
  }, [formState.formEdited, entryId]);

  // Enhanced field change handler with detailed logging
  const onFieldChange = (field: string, value: string) => {
    console.debug(`[EntryFormItem] Field change for entry ${entryId}: ${field}=${value}`, {
      disabled,
      currentValue: (formState as any)[field]
    });
    
    if (disabled) {
      console.warn(`[EntryFormItem] Ignoring field change because form is disabled: ${entryId}`);
      return;
    }
    
    handleFieldChange(field, value);
    console.debug(`[EntryFormItem] Field change handler executed for ${entryId}`);
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
  
  // Enhanced delete handler
  const handleDelete = () => {
    console.debug(`[EntryFormItem] Delete clicked for entry ${entryId}`, { disabled });
    
    if (disabled) {
      console.warn(`[EntryFormItem] Delete prevented - form is disabled: ${entryId}`);
      return;
    }
    
    onDelete();
  };

  // Check if form has content to determine save button state
  const hasContent = !!(
    formState.hours || 
    formState.description || 
    formState.jobNumber || 
    formState.rego || 
    formState.taskNumber
  );
  
  const canSave = !disabled && formState.formEdited && hasContent;

  return (
    <div className="bg-white rounded-md shadow p-3 border border-gray-200" 
         data-entry-id={entryId}
         data-disabled={disabled ? 'true' : 'false'}>
      <InlineEntryForm 
        visibleFields={[
          { id: "job", name: "Job Number", type: "text", required: false, visible: true },
          { id: "rego", name: "Rego", type: "text", required: false, visible: true },
          { id: "task", name: "Task Number", type: "text", required: false, visible: true },
          { id: "notes", name: "Notes", type: "text", required: false, visible: true },
          { id: "hours", name: "Hours", type: "number", required: true, visible: true }
        ]}
        formValues={formState}
        onFieldChange={onFieldChange}
        onDelete={handleDelete}
        entryId={entryId}
        disabled={disabled}
      />
      <div className="flex justify-end mt-2">
        <Button 
          size="sm" 
          onClick={onSave}
          className={`${canSave ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'} text-white`}
          disabled={disabled || !formState.formEdited || !hasContent || isSaving}
          data-testid={`save-button-${entryId}`}
        >
          {isSaving ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>
    </div>
  );
};

export default EntryFormItem;
