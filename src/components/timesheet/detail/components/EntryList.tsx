
import React from "react";
import { TimeEntry } from "@/types";
import EntryListItem from "./EntryListItem";
import { useToast } from "@/hooks/use-toast";
import { useEntriesContext } from "@/contexts/timesheet";

interface EntryListProps {
  entries: TimeEntry[];
  interactive?: boolean;
}

const EntryList: React.FC<EntryListProps> = ({ entries, interactive = true }) => {
  const { deleteEntry } = useEntriesContext();
  const { toast } = useToast();
  
  // Handle entry deletion
  const handleDeleteEntry = (entryId: string) => {
    console.log("EntryList: Deleting entry:", entryId);
    
    deleteEntry(entryId);
    
    // Provide feedback to user
    toast({
      title: "Entry deleted",
      description: "The timesheet entry has been removed successfully",
    });
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
      <div className="space-y-2">
        {entries.map(entry => (
          <EntryListItem 
            key={`entry-${entry.id}`} 
            entry={entry}
            onDelete={() => handleDeleteEntry(entry.id)}
            interactive={interactive}
          />
        ))}
      </div>
    </div>
  );
};

export default EntryList;
