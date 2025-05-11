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
  console.debug('Current formHandlers:', formHandlers.map(f => f.id)); // ✅ DEBUG: log current form IDs

  return (
    <div className="space-y-4 mt-4 mb-4">
      {formHandlers.map((formHandler, index) => {
        const formId = formHandler.id;
        const isVisible = formVisibility[formId];

        console.debug(`Rendering form with id: ${formId}`); // ✅ DEBUG: log per form render

        return (
          <div
            key={formId}
            className={getFormClass(formId)}
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
