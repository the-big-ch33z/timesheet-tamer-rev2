
import React from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryFormsList from "../components/EntryFormsList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TimeEntryFormManagerProps {
  formHandlers: UseTimeEntryFormReturn[];
  interactive: boolean;
  onCreateEntry: (startTime: string, endTime: string, hours: number) => void;
  startTime: string;
  endTime: string;
  calculatedHours: number;
  showEntryForms: boolean[];
  addEntryForm: () => void;
  removeEntryForm: (index: number) => void;
  handleSaveEntry: (index: number) => void;
  key: number;
}

const TimeEntryFormManager: React.FC<TimeEntryFormManagerProps> = ({
  formHandlers,
  interactive,
  showEntryForms,
  addEntryForm,
  removeEntryForm,
  handleSaveEntry,
  key
}) => {
  if (!interactive) return null;

  return (
    <div className="mt-4">
      {/* Entry Forms */}
      {showEntryForms.length > 0 && (
        <EntryFormsList
          showEntryForms={showEntryForms}
          formHandlers={formHandlers}
          handleSaveEntry={handleSaveEntry}
          removeEntryForm={removeEntryForm}
          key={`forms-list-${key}`}
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
    </div>
  );
};

export default TimeEntryFormManager;
