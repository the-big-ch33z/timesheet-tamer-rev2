
import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useEntriesContext } from "@/contexts/timesheet";

interface EntryListItemProps {
  entry: TimeEntry;
}

const EntryListItem: React.FC<EntryListItemProps> = ({ entry }) => {
  const { deleteEntry } = useEntriesContext();
  
  const handleDelete = () => {
    console.log("Deleting entry:", entry.id);
    deleteEntry(entry.id);
  };
  
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white mb-2">
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">{entry.hours} hours</span>
          <span className="text-sm text-gray-500">
            {entry.startTime && entry.endTime ? 
              `${entry.startTime} - ${entry.endTime}` : 
              format(new Date(entry.date), "MMM d, yyyy")}
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
      
      <Button
        variant="ghost"
        size="icon"
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        aria-label="Delete entry"
      >
        <Trash2 size={18} />
      </Button>
    </div>
  );
};

export default EntryListItem;
