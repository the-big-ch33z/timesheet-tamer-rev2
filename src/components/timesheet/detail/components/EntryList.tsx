
import React from "react";
import { TimeEntry } from "@/types";
import EntryListItem from "./EntryListItem";
import { useEntriesContext } from "@/contexts/timesheet";

interface EntryListProps {
  entries: TimeEntry[];
}

const EntryList: React.FC<EntryListProps> = ({ entries }) => {
  const { deleteEntry } = useEntriesContext();
  
  // Handle entry deletion
  const handleDeleteEntry = (entryId: string) => {
    console.log("EntryList: Deleting entry:", entryId);
    deleteEntry(entryId);
  };
  
  if (entries.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No time entries for this day.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Time Entries:</h3>
      <div className="space-y-2">
        {entries.map(entry => (
          <EntryListItem 
            key={`entry-${entry.id}`} 
            entry={entry}
            onDelete={() => handleDeleteEntry(entry.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default EntryList;
