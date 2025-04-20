
import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";
import { useEntriesContext } from "@/contexts/timesheet";
import { formatDateForDisplay } from "@/utils/time/formatting";
import { ensureDate } from "@/utils/time/validation";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";

interface EntryListItemProps {
  entry: TimeEntry;
  onDelete?: () => void;
  interactive?: boolean;
  isDeleting?: boolean;
}

const EntryListItem: React.FC<EntryListItemProps> = ({ 
  entry, 
  onDelete,
  interactive = true,
  isDeleting = false
}) => {
  const { deleteEntry } = useEntriesContext();
  const { getWorkHoursForDate } = useTimesheetWorkHours();
  
  const handleDelete = async () => {
    if (isDeleting) return;
    
    console.log("Deleting entry:", entry.id);
    
    if (onDelete) {
      onDelete();
    } else if (deleteEntry) {
      await deleteEntry(entry.id);
    }
  };
  
  const entryDate = ensureDate(entry.date) || new Date();
  const workHours = getWorkHoursForDate(entryDate, entry.userId);
  
  return (
    <div className="flex items-center p-3 border border-gray-200 rounded-md bg-white mb-2 gap-3">
      <div className="flex items-center gap-1 text-green-700 font-medium min-w-16">
        <Clock size={16} />
        {entry.hours}h
      </div>
      
      {workHours.hasData && (
        <div className="hidden md:block text-xs text-gray-500 min-w-24">
          {workHours.startTime || '--:--'} - {workHours.endTime || '--:--'}
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
          disabled={isDeleting}
          aria-label="Delete entry"
        >
          {isDeleting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Trash2 size={18} />
          )}
        </Button>
      )}
    </div>
  );
};

export default EntryListItem;
