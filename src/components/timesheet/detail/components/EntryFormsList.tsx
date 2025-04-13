
import React from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryFormItem from "./EntryFormItem";

interface EntryFormsListProps {
  showEntryForms: boolean[];
  formHandlers: UseTimeEntryFormReturn[];
  handleSaveEntry?: (index: number) => void;
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
    </div>
  );
};

export default EntryFormsList;
