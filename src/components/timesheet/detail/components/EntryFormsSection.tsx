
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  addEntryForm,
  interactive
}) => {
  if (!interactive) return null;
  
  return (
    <>
      {/* Entry Forms List */}
      {showEntryForms.length > 0 && (
        <EntryFormsList
          showEntryForms={showEntryForms}
          formHandlers={formHandlers}
          handleSaveEntry={handleSaveEntry}
          removeEntryForm={removeEntryForm}
        />
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
    </>
  );
};

export default EntryFormsSection;
