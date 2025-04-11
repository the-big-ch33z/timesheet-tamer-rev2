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
  onAddEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
  workSchedule?: WorkSchedule;
  userId?: string;
}

const EntriesSection: React.FC<EntriesSectionProps> = ({
  date,
  entries,
  onAddEntry,
  onDeleteEntry,
  readOnly = false,
  workSchedule,
  userId
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
      userId: userId // Ensure userId is set in the new entry
    };
    
    // Call the parent handler with the new entry
    onAddEntry(newEntry);
    
    // Keep the form open to allow adding multiple entries
    // (Don't close the form after adding an entry)
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
          userId={userId}
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
