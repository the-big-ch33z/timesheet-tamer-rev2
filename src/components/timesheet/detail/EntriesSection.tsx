
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TimeEntryDialog from "../TimeEntryDialog";
import { TimeEntry } from "@/types";

interface EntriesSectionProps {
  date: Date;
  entries: TimeEntry[];
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  onDeleteEntry: (id: string) => void;
}

const EntriesSection: React.FC<EntriesSectionProps> = ({
  date,
  entries,
  onSaveEntry,
  onDeleteEntry,
}) => {
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  const handleSaveEntry = (entry: Omit<TimeEntry, "id">) => {
    onSaveEntry(entry);
    setShowNewEntryForm(false);
  };

  const handleDeleteEntry = (id?: string) => {
    if (id) {
      onDeleteEntry(id);
    }
    setShowNewEntryForm(false);
  };

  return (
    <>
      <div className="space-y-2 mb-4">
        {entries.map((entry) => (
          <TimeEntryDialog
            key={entry.id}
            onSave={handleSaveEntry}
            onDelete={handleDeleteEntry}
            selectedDate={date}
            entryId={entry.id}
            initialData={entry}
          />
        ))}
        
        {/* New entry form */}
        {showNewEntryForm && (
          <TimeEntryDialog
            onSave={handleSaveEntry}
            onDelete={() => setShowNewEntryForm(false)}
            selectedDate={date}
          />
        )}
      </div>

      {/* Add Entry Button */}
      <Button 
        onClick={() => setShowNewEntryForm(true)}
        className="w-full bg-green-600 hover:bg-green-700 text-white my-2"
        size="sm"
      >
        <Plus className="h-4 w-4 mr-1" /> Add Entry
      </Button>
    </>
  );
};

export default EntriesSection;
