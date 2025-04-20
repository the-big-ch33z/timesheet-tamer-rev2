
import React, { useState, useEffect } from "react";
import { TimeEntry } from "@/types";
import EntryListItem from "./EntryListItem";
import { useToast } from "@/hooks/use-toast";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/TimeEntryContext";
import { unifiedTimeEntryService } from "@/utils/time/services";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('EntryList');

interface EntryListProps {
  entries: TimeEntry[];
  interactive?: boolean;
  onDelete?: (entryId: string) => Promise<boolean>;
}

const EntryList: React.FC<EntryListProps> = ({ 
  entries, 
  interactive = true,
  onDelete
}) => {
  const { deleteEntry } = useTimeEntryContext();
  const { toast } = useToast();
  const [deletingEntryIds, setDeletingEntryIds] = useState<Set<string>>(new Set());
  
  // Add debug logging to track entries passed to this component
  useEffect(() => {
    logger.debug(`EntryList received ${entries.length} entries`);
    if (entries.length > 0) {
      logger.debug('Entry IDs:', entries.map(e => e.id));
    }
  }, [entries]);
  
  const handleDeleteEntry = async (entryId: string) => {
    console.log("EntryList: Deleting entry:", entryId);
    
    // Prevent multiple delete operations for the same entry
    if (deletingEntryIds.has(entryId)) {
      console.log("Already deleting this entry, skipping duplicate request");
      return;
    }
    
    try {
      // Mark entry as being deleted
      setDeletingEntryIds(prev => {
        const updated = new Set(prev);
        updated.add(entryId);
        return updated;
      });
      
      // Add to the deleted entries tracker first
      await unifiedTimeEntryService.deleteEntryFromStorage(entryId);
      
      // Use the passed onDelete function if provided, otherwise use the context function
      const result = await (onDelete ? onDelete(entryId) : deleteEntry(entryId));
      
      if (!result) {
        toast({
          title: "Error",
          description: "Could not delete the timesheet entry",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Entry deleted",
          description: "The timesheet entry has been removed successfully",
        });
        
        // Notify other tabs after successful deletion
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
            detail: { entryId }
          }));
        }
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete the timesheet entry",
        variant: "destructive"
      });
    } finally {
      // Remove from deleting set even if there was an error
      setDeletingEntryIds(prev => {
        const updated = new Set(prev);
        updated.delete(entryId);
        return updated;
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

  if (entries.length <= 3) {
    // For a few entries, use the list style
    return (
      <div className="space-y-2">
        {entries.map(entry => (
          <EntryListItem 
            key={`entry-${entry.id}`} 
            entry={entry}
            onDelete={() => handleDeleteEntry(entry.id)}
            interactive={interactive}
            isDeleting={deletingEntryIds.has(entry.id)}
          />
        ))}
      </div>
    );
  }
  
  // For many entries use the table layout for better organization
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Hours</TableHead>
            <TableHead className="w-24 hidden md:table-cell">Time</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(entry => (
            <TableRow key={`entry-${entry.id}`}>
              <TableCell className="font-medium">{entry.hours}h</TableCell>
              <TableCell className="hidden md:table-cell text-xs">
                {entry.startTime || '--:--'} - {entry.endTime || '--:--'}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {entry.jobNumber && (
                    <span className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded">
                      Job: {entry.jobNumber}
                    </span>
                  )}
                  {entry.rego && (
                    <span className="text-xs bg-purple-50 text-purple-800 px-2 py-1 rounded">
                      Rego: {entry.rego}
                    </span>
                  )}
                  {entry.taskNumber && (
                    <span className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded">
                      Task: {entry.taskNumber}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="truncate max-w-xs">{entry.description}</div>
              </TableCell>
              <TableCell>
                {interactive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteEntry(entry.id)}
                    disabled={deletingEntryIds.has(entry.id)}
                    aria-label="Delete entry"
                  >
                    {deletingEntryIds.has(entry.id) ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EntryList;
