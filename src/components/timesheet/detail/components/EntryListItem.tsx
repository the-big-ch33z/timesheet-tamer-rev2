
import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useEntriesContext } from "@/contexts/timesheet";
import { formatDateForDisplay } from "@/utils/time/formatting";
import { ensureDate } from "@/utils/time/validation";

interface EntryListItemProps {
  entry: TimeEntry;
  onDelete?: () => void;
  interactive?: boolean;
}

const EntryListItem: React.FC<EntryListItemProps> = ({ 
  entry, 
  onDelete,
  interactive = true 
}) => {
  const { deleteEntry } = useEntriesContext();
  
  const handleDelete = () => {
    console.log("Deleting entry:", entry.id);
    
    // Use the provided onDelete if available, otherwise use the context method
    if (onDelete) {
      onDelete();
    } else {
      deleteEntry(entry.id);
    }
  };
  
  // Ensure entry.date is a valid Date object for formatting
  const entryDate = ensureDate(entry.date) || new Date();
  const formattedDate = formatDateForDisplay(entryDate);
  
  return (
    <div className="flex items-center p-3 border border-gray-200 rounded-md bg-white mb-2 space-x-4">
      <div className="flex-none font-medium w-20">{entry.hours} hours</div>
      
      {entry.jobNumber && <div className="flex-none text-sm w-24">Job: {entry.jobNumber}</div>}
      {entry.rego && <div className="flex-none text-sm w-24">Rego: {entry.rego}</div>}
      {entry.taskNumber && <div className="flex-none text-sm w-24">Task: {entry.taskNumber}</div>}
      
      {entry.description && (
        <div className="flex-1 text-sm text-gray-600 truncate">
          {entry.description}
        </div>
      )}
      
      {interactive && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-none text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
          aria-label="Delete entry"
        >
          <Trash2 size={18} />
        </Button>
      )}
    </div>
  );
};

export default EntryListItem;
