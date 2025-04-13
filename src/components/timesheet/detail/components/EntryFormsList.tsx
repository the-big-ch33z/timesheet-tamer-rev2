
import React from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryFormItem from "./EntryFormItem";

interface EntryFormsListProps {
  showEntryForms: boolean[];
  formHandlers: UseTimeEntryFormReturn[];
  handleSaveEntry: (index: number) => void;
  removeEntryForm: (index: number) => void;
  addEntryForm?: () => void;  // Optional prop
}

const EntryFormsList: React.FC<EntryFormsListProps> = ({
  showEntryForms,
  formHandlers,
  handleSaveEntry,
  removeEntryForm
}) => {
  if (showEntryForms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4 mb-4">
      {showEntryForms.map((_, index) => {
        // Only render forms that have corresponding handlers
        const formHandler = formHandlers[index];
        
        if (!formHandler) {
          console.log("No form handler for index:", index);
          return <div key={`form-loading-${index}`} className="p-3 animate-pulse bg-gray-100 rounded">Loading form...</div>;
        }
        
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
  );
};

export default EntryFormsList;
