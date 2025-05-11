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

const EntryFormsList: React.FC<EntryFormsListProps> = memo(({
  formVisibility,
  formHandlers,
  handleSaveEntry,
  removeEntryForm,
  getFormClass
}) => {
  // Generate stable form IDs (optionally replace with UUIDs if possible)
  const formIds = useMemo(
    () => formHandlers.map((_, index) => `entry-form-${index}`),
    [formHandlers.length]
  );

  // If all are hidden, don't render container
  const hasVisibleForms = formIds.some(id => formVisibility[id]);

  if (!hasVisibleForms) return null;

  return (
    <div className="space-y-4 mt-4 mb-4">
      {formHandlers.map((formHandler, index) => {
        const formId = formIds[index];

        return (
          <div
            key={formId}
            className={getFormClass(formId)} // CSS controls visibility
            data-form-id={formId}
          >
            <EntryFormItem
              key={`${formId}-item`}
              formId={formId}
              formState={formHandler.formState}
              handleFieldChange={(field, value) =>
                formHandler.handleFieldChange(field, value)
              }
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

EntryFormsList.displayName = "EntryFormsList";

export default EntryFormsList;
