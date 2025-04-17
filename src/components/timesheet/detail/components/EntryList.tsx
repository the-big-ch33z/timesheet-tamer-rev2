
import React from "react";
import { TimeEntry } from "@/types";
import EntryListItem from "./EntryListItem";
import { useToast } from "@/hooks/use-toast";
import { useEntriesContext } from "@/contexts/timesheet";
import { unifiedTimeEntryService } from "@/utils/time/services/unifiedTimeEntryService";

interface EntryListProps {
  entries: TimeEntry[];
  interactive?: boolean;
  onDelete?: (entryId: string) => boolean;
}

const EntryList: React.FC<EntryListProps> = ({ 
  entries, 
  interactive = true,
  onDelete
}) => {
  const { deleteEntry } = useEntriesContext();
  const { toast } = useToast();
  
  const handleDeleteEntry = async (entryId: string) => {
    console.log("EntryList: Deleting entry:", entryId);
    
    // First, add to the deleted entries tracker to ensure it stays deleted
    unifiedTimeEntryService.deleteEntryFromStorage(entryId);
    
    try {
      // Use the passed onDelete function if provided, otherwise use the context function
      const result = onDelete ? onDelete(entryId) : deleteEntry(entryId);
      
      if (!result) {
        toast({
          title: "Error",
          description: "Could not delete the timesheet entry",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Entry deleted",
        description: "The timesheet entry has been removed successfully",
      });
      
      // Force storage sync and notify other tabs about the deletion
      window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
        detail: { entryId }
      }));
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete the timesheet entry",
        variant: "destructive"
      });
    }
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
