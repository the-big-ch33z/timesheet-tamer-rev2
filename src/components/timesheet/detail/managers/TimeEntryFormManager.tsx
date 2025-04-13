
import React from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryFormsList from "../components/EntryFormsList";
import { useEntryForms } from "../hooks/useEntryForms";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TimeEntryFormManagerProps {
  formHandlers: UseTimeEntryFormReturn[];
  interactive: boolean;
  onCreateEntry: (startTime: string, endTime: string, hours: number) => void;
  startTime: string;
  endTime: string;
  calculatedHours: number;
}

const TimeEntryFormManager: React.FC<TimeEntryFormManagerProps> = ({
  formHandlers,
  interactive,
  onCreateEntry,
  startTime,
  endTime,
  calculatedHours
}) => {
  const {
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    refreshForms
  } = useEntryForms({ formHandlers });

  // Handle saving an entry form
  const handleSaveEntry = (index: number) => {
    if (!interactive || !formHandlers[index]) return;

    const formHandler = formHandlers[index];
    const formData = formHandler.getFormData();
    
    console.log("Saving entry with data:", formData);
    
    onCreateEntry(
      formData.startTime || startTime,
      formData.endTime || endTime,
      parseFloat(formData.hours.toString()) || calculatedHours
    );
    
    // Reset the form
    formHandler.resetFormEdited();
    formHandler.resetForm();
    
    // Force a re-render after the entry is added
    setTimeout(() => {
      console.log("Refreshing forms after save");
      refreshForms();
    }, 100);
  };

  if (!interactive) return null;

  return (
    <div className="mt-4">
      {/* Entry Forms */}
      {showEntryForms.length > 0 && (
        <div className="space-y-4 mt-4 mb-4">
          {showEntryForms.map((_, index) => {
            const formHandler = formHandlers[index];
            
            return (
              <EntryFormItem
                key={`form-${index}`}
                formState={formHandler.formState}
                handleFieldChange={(field, value) => formHandler.handleFieldChange(field, value)}
                handleSave={() => handleSaveEntry(index)}
                onDelete={() => removeEntryForm(index)}
                entryId={`new-${index}`}
              />
            );
          })}
        </div>
      )}
      
      {/* Add Entry Button */}
      <Button 
        onClick={addEntryForm}
        size="sm"
        className="bg-green-500 hover:bg-green-600 text-white"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Entry
      </Button>
    </div>
  );
};

// Re-export the EntryFormItem component here to avoid circular dependencies
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
  const onFieldChange = (field: string, value: string) => {
    console.log(`EntryFormItem field change: ${field} = ${value}`);
    handleFieldChange(field, value);
  };

  return (
    <div className="bg-white rounded-md shadow p-3 border border-gray-200">
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
        onDelete={onDelete}
        entryId={entryId}
        disabled={disabled}
      />
      <div className="flex justify-end mt-2">
        <Button 
          size="sm" 
          onClick={handleSave}
          className="bg-green-500 hover:bg-green-600 text-white"
          disabled={disabled || !formState.formEdited}
        >
          Save Entry
        </Button>
      </div>
    </div>
  );
};

// Import InlineEntryForm to avoid circular dependencies
import InlineEntryForm from "@/components/timesheet/entry-dialog/form/InlineEntryForm";

export default TimeEntryFormManager;
