
import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";
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
  
  return (
    <div className="flex items-center p-3 border border-gray-200 rounded-md bg-white mb-2 gap-3">
      <div className="flex items-center gap-1 text-green-700 font-medium min-w-16">
        <Clock size={16} />
        {entry.hours}h
      </div>
      
      {/* Display time range if available */}
      {(entry.startTime || entry.endTime) && (
        <div className="hidden md:block text-xs text-gray-500 min-w-24">
          {entry.startTime || '--:--'} - {entry.endTime || '--:--'}
        </div>
      )}
      
      <div className="flex flex-wrap gap-x-4 flex-1">
        {entry.jobNumber && (
          <div className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded">
            Job: {entry.jobNumber}
          </div>
        )}
        
        {entry.rego && (
          <div className="text-xs bg-purple-50 text-purple-800 px-2 py-1 rounded">
            Rego: {entry.rego}
          </div>
        )}
        
        {entry.taskNumber && (
          <div className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded">
            Task: {entry.taskNumber}
          </div>
        )}
      </div>
      
      {entry.description && (
        <div className="hidden md:block flex-1 text-sm text-gray-600 truncate max-w-xs">
          {entry.description}
        </div>
      )}
      
      {interactive && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-none text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
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
