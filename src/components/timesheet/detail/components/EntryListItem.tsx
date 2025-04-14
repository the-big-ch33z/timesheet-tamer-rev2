
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
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white mb-2">
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">{entry.hours} hours</span>
          <span className="text-sm text-gray-500">
            {entry.startTime && entry.endTime ? 
              `${entry.startTime} - ${entry.endTime}` : 
              formattedDate}
          </span>
        </div>
        
        {/* Show entry details if available */}
        {(entry.jobNumber || entry.rego || entry.taskNumber || entry.description) && (
          <div className="text-sm text-gray-700 mt-1">
            {entry.jobNumber && <span className="mr-2">Job: {entry.jobNumber}</span>}
            {entry.rego && <span className="mr-2">Rego: {entry.rego}</span>}
            {entry.taskNumber && <span>Task: {entry.taskNumber}</span>}
            {entry.description && (
              <p className="mt-1 text-gray-600 text-sm">{entry.description}</p>
            )}
          </div>
        )}
      </div>
      
      {interactive && (
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
