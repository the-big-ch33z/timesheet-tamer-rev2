
import React from "react";
import EntryFormItem from "./EntryFormItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/useTimeEntryForm";

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
  return (
    <div className="mt-4">
      {/* Entry Forms */}
      {showEntryForms.length > 0 && (
        <div className="space-y-4 mt-4 mb-4">
          {showEntryForms.map((_, index) => {
            const { formState, handleFieldChange, handleSave } = formHandlers[index];
            
            return (
              <EntryFormItem
                key={index}
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
