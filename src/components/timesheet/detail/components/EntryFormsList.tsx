
import React, { memo } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryFormItem from "./EntryFormItem";

interface EntryFormsListProps {
  showEntryForms: boolean[];
  formHandlers: UseTimeEntryFormReturn[];
  handleSaveEntry: (index: number) => void;
  removeEntryForm: (index: number) => void;
}

// Use memo to prevent unnecessary re-renders
const EntryFormsList: React.FC<EntryFormsListProps> = memo(({
  showEntryForms,
  formHandlers,
  handleSaveEntry,
  removeEntryForm
}) => {
  if (showEntryForms.filter(Boolean).length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4 mb-4">
      {showEntryForms.map((isVisible, index) => {
        // Only render visible forms that have corresponding handlers
        if (!isVisible || index >= formHandlers.length) return null;
        
        const formHandler = formHandlers[index];
        
        if (!formHandler) {
          console.debug("No form handler for index:", index);
          return null;
        }
        
        return (
          <EntryFormItem
            key={`form-${index}`}
            formState={formHandler.formState}
            handleFieldChange={(field, value) => formHandler.handleFieldChange(field, value)}
            handleSave={() => handleSaveEntry(index)}
            onDelete={() => removeEntryForm(index)}
            entryId={`entry-${index}`}
          />
        );
      })}
    </div>
  );
});

// Add display name for better debugging
EntryFormsList.displayName = "EntryFormsList";

export default EntryFormsList;
