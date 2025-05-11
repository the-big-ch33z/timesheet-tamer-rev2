import React, { memo } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryFormsList from "./EntryFormsList";

interface EntryFormsSectionProps {
  formVisibility: Record<string, boolean>;
  formHandlers: UseTimeEntryFormReturn[];
  addEntryForm: () => void;
  removeEntryForm: (index: number) => void;
  handleSaveEntry: (index: number) => void;
  interactive: boolean;
  getFormClass: (formId: string) => string;
}

const EntryFormsSection: React.FC<EntryFormsSectionProps> = ({
  formVisibility,
  formHandlers,
  handleSaveEntry,
  removeEntryForm,
  interactive,
  getFormClass
}) => {
  // Always render the section if interactive is true
  if (!interactive) return null;

  return (
    <div data-testid="entry-forms-section">
      <EntryFormsList 
        formVisibility={formVisibility}
        formHandlers={formHandlers}
        handleSaveEntry={handleSaveEntry}
        removeEntryForm={removeEntryForm}
        getFormClass={getFormClass}
      />
    </div>
  );
};

export default memo(EntryFormsSection);
