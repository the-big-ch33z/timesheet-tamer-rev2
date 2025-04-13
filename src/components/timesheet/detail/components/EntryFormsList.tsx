
import React from "react";
import EntryFormItem from "./EntryFormItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";

interface EntryFormsListProps {
  showEntryForms: boolean[];
  formHandlers: UseTimeEntryFormReturn[];
  addEntryForm: () => void;
  removeEntryForm: (index: number) => void;
}

const EntryFormsList: React.FC<EntryFormsListProps> = ({
  showEntryForms,
  formHandlers,
  addEntryForm,
  removeEntryForm
}) => {
  // Only display forms if there are any to show
  const shouldShowForms = showEntryForms.length > 0;

  return (
    <div className="mt-4">
      {/* Entry Forms */}
      {shouldShowForms && (
        <div className="space-y-4 mt-4 mb-4">
          {showEntryForms.map((_, index) => {
            const { formState, handleFieldChange, handleSave } = formHandlers[index];
            
            return (
              <EntryFormItem
                key={`form-${index}`}
                formState={formState}
                handleFieldChange={handleFieldChange}
                handleSave={handleSave}
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

export default EntryFormsList;
