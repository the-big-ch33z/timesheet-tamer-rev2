
import React, { useState } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TimeEntryItem from "../entry-display/TimeEntryItem";
import NewEntryForm from "../entry-display/NewEntryForm";
import { v4 as uuidv4 } from "uuid";
import TimeEntryList from "../entry-display/TimeEntryList";

interface EntriesSectionProps {
  date: Date;
  entries: TimeEntry[];
  onAddEntry: () => void;
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
  workSchedule?: WorkSchedule;
}

const EntriesSection: React.FC<EntriesSectionProps> = ({
  date,
  entries,
  onAddEntry,
  onDeleteEntry,
  readOnly = false,
  workSchedule
}) => {
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  const handleAddEntry = () => {
    setIsAddingEntry(true);
  };

  const handleCancelAddEntry = () => {
    setIsAddingEntry(false);
  };

  const handleSaveEntry = (entry: Omit<TimeEntry, "id">) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: uuidv4(),
    };
    
    // Create a custom event to notify about the new entry
    const event = new CustomEvent('entry-added', {
      detail: newEntry
    });
    document.dispatchEvent(event);
    
    // Call the parent handler
    onAddEntry();
    
    // Close the form
    setIsAddingEntry(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Time Entries</h3>
        {!readOnly && !isAddingEntry && (
          <Button 
            size="sm" 
            onClick={handleAddEntry} 
            variant="outline" 
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Entry
          </Button>
        )}
      </div>

      {isAddingEntry && (
        <NewEntryForm 
          date={date} 
          onSaveEntry={handleSaveEntry} 
          onCancel={handleCancelAddEntry}
          workSchedule={workSchedule}
        />
      )}

      <TimeEntryList 
        entries={entries}
        onDeleteEntry={onDeleteEntry}
        readOnly={readOnly}
      />
    </div>
  );
};

export default EntriesSection;
