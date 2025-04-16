
import React, { useState } from "react";
import { UseTimeEntryFormReturn } from "@/hooks/timesheet/types/timeEntryTypes";
import EntryFormsList from "../components/EntryFormsList";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";

interface TimeEntryFormManagerProps {
  formHandlers: UseTimeEntryFormReturn[];
  interactive: boolean;
  onCreateEntry: (startTime: string, endTime: string, hours: number) => void;
  startTime: string;
  endTime: string;
  calculatedHours: number;
  showEntryForms: boolean[]; // Changed from number[] to boolean[]
  addEntryForm: () => void;
  removeEntryForm: (index: number) => void;
  handleSaveEntry: (index: number) => void;
  saveAllPendingChanges: () => boolean;
  key: number;
}

const TimeEntryFormManager: React.FC<TimeEntryFormManagerProps> = ({
  formHandlers,
  interactive,
  showEntryForms,
  addEntryForm,
  removeEntryForm,
  handleSaveEntry,
  saveAllPendingChanges,
  key
}) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!interactive) return null;
  
  // Handle save all entries
  const handleSaveAll = () => {
    console.debug("[TimeEntryFormManager] Save All button clicked");
    setIsSaving(true);
    try {
      const saved = saveAllPendingChanges();
      console.debug("[TimeEntryFormManager] Save All completed, entries saved:", saved);
    } finally {
      // Reset saving state after a short delay to show feedback
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  // Check if any forms have been edited
  const hasEditedForms = showEntryForms.some(
    (isVisible, index) => isVisible && index < formHandlers.length && formHandlers[index].formState.formEdited
  );

  // Check if there are any current forms
  const hasOpenForms = showEntryForms.filter(Boolean).length > 0;

  return (
    <div className="mt-4">
      {/* Entry Forms */}
      {showEntryForms.filter(Boolean).length > 0 && (
        <div className="mb-4">
          <EntryFormsList
            showEntryForms={showEntryForms}
            formHandlers={formHandlers}
            handleSaveEntry={handleSaveEntry}
            removeEntryForm={removeEntryForm}
            key={`forms-list-${key}`}
          />
          
          {/* Save All Button - Only show when forms are open and edited */}
          {hasEditedForms && (
            <div className="flex justify-end mt-2">
              <Button 
                onClick={handleSaveAll}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? "Saving..." : "Save All Changes"}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Add Entry Button */}
        <Button 
          onClick={addEntryForm}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          {hasOpenForms ? "Add Another Entry" : "Add Entry"}
        </Button>
        
        {/* Save All Button - Alternative position when no forms are edited */}
        {hasOpenForms && !hasEditedForms && (
          <Button 
            onClick={handleSaveAll}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save All"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TimeEntryFormManager;
