
import React from "react";
import EntryFormsList from "./EntryFormsList";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";

interface EntryFormsSectionProps {
  showEntryForms: boolean[];
  formHandlers: UseTimeEntryFormReturn[];
  handleSaveEntry: (index: number) => void;
  removeEntryForm: (index: number) => void;
  addEntryForm: () => void;
  interactive: boolean;
}

const EntryFormsSection: React.FC<EntryFormsSectionProps> = ({
  showEntryForms,
  formHandlers,
  handleSaveEntry,
  removeEntryForm,
  interactive
}) => {
  if (!interactive) return null;
  
  return (
    <EntryFormsList
      showEntryForms={showEntryForms}
      formHandlers={formHandlers}
      handleSaveEntry={handleSaveEntry}
      removeEntryForm={removeEntryForm}
    />
  );
};

export default EntryFormsSection;
