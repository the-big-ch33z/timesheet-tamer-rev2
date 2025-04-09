
import React, { useState } from "react";
import { TimeEntry } from "@/types";
import TimeEntryList from "../entry-display/TimeEntryList";
import AddEntryButton from "../entry-display/AddEntryButton";
import NewEntryForm from "../entry-display/NewEntryForm";

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

  return (
    <>
      <TimeEntryList 
        entries={entries}
        date={date}
        onSaveEntry={onSaveEntry}
        onDeleteEntry={onDeleteEntry}
      />
      
      {/* New entry form */}
      {showNewEntryForm && (
        <NewEntryForm
          date={date}
          onSaveEntry={handleSaveEntry}
          onCancel={() => setShowNewEntryForm(false)}
        />
      )}

      {/* Add Entry Button */}
      <AddEntryButton onClick={() => setShowNewEntryForm(true)} />
    </>
  );
};

export default EntriesSection;
