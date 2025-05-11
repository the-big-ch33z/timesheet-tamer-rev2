
import React, { memo, useMemo } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryFormItem from "./EntryFormItem";

interface EntryFormsListProps {
  formVisibility: Record<string, boolean>;
  formHandlers: UseTimeEntryFormReturn[];
  handleSaveEntry: (index: number) => void;
  removeEntryForm: (index: number) => void;
  getFormClass: (formId: string) => string;
}

// Use memo to prevent unnecessary re-renders
const EntryFormsList: React.FC<EntryFormsListProps> = memo(({
  formVisibility,
  formHandlers,
  handleSaveEntry,
  removeEntryForm,
  getFormClass
}) => {
  // Generate stable form IDs for consistent keys
  const formIds = useMemo(() => 
    formHandlers.map((_, index) => `entry-form-${index}`),
    [formHandlers.length] // Only regenerate when length changes
  );
  
  if (Object.values(formVisibility).filter(Boolean).length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4 mb-4">
      {formHandlers.map((formHandler, index) => {
        const formId = formIds[index];
        
        // Always render the form but control visibility with CSS
        return (
          <div 
            key={formId} 
            className={getFormClass(formId)}
            data-form-id={formId}
          >
            <EntryFormItem
              key={`${formId}-item`} // Add more stable keys
              formId={formId} // Pass stable ID to the form
              formState={formHandler.formState}
              handleFieldChange={(field, value) => formHandler.handleFieldChange(field, value)}
              handleSave={() => handleSaveEntry(index)}
              onDelete={() => removeEntryForm(index)}
              entryId={formId}
            />
          </div>
        );
      })}
    </div>
  );
});

// Add display name for better debugging
EntryFormsList.displayName = "EntryFormsList";

export default EntryFormsList;
