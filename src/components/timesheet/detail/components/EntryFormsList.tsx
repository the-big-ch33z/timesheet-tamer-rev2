
import React from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryFormItem from "../components/EntryFormItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EntryFormsListProps {
  showEntryForms: boolean[];
  formHandlers: UseTimeEntryFormReturn[];
  handleSaveEntry?: (index: number) => void;
  removeEntryForm: (index: number) => void;
  addEntryForm?: () => void;  // Made this optional since it's used in WorkHoursContainer but not in TimeEntryManager
}

const EntryFormsList: React.FC<EntryFormsListProps> = ({
  showEntryForms,
  formHandlers,
  handleSaveEntry,
  removeEntryForm,
  addEntryForm
}) => {
  if (showEntryForms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4 mb-4">
      {showEntryForms.map((_, index) => {
        const formHandler = formHandlers[index];
        
        if (!formHandler) return null;
        
        return (
          <EntryFormItem
            key={`form-${index}`}
            formState={formHandler.formState}
            handleFieldChange={(field, value) => formHandler.handleFieldChange(field, value)}
            handleSave={() => handleSaveEntry?.(index)}
            onDelete={() => removeEntryForm(index)}
            entryId={`new-${index}`}
          />
        );
      })}
      
      {/* Add entry button - only displayed if addEntryForm prop was provided */}
      {addEntryForm && (
        <Button 
          onClick={addEntryForm}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Entry
        </Button>
      )}
    </div>
  );
};

export default EntryFormsList;
