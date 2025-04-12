
import React from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useLogger } from "@/hooks/useLogger";

interface TimeEntryItemProps {
  entry: TimeEntry;
  onDelete: () => void;
  readOnly?: boolean;
}

const TimeEntryItem: React.FC<TimeEntryItemProps> = ({ entry, onDelete, readOnly = false }) => {
  const logger = useLogger("TimeEntryItem");
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug("Delete button clicked for entry", { id: entry.id });
    onDelete();
  };

  return (
    <div className="flex items-center gap-2 bg-white border rounded-md p-3">
      <div className="w-16 text-center">
        <div className="font-medium">{entry.hours}</div>
        <div className="text-xs text-gray-500">Hours</div>
      </div>
      
      <div className="flex-1">
        <div className="flex gap-2 mb-1">
          {entry.jobNumber && (
            <div className="bg-gray-100 px-2 py-1 rounded text-sm">
              {entry.jobNumber}
            </div>
          )}
          
          {entry.rego && (
            <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">
              {entry.rego}
            </div>
          )}
          
          {entry.taskNumber && (
            <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-sm">
              {entry.taskNumber}
            </div>
          )}
        </div>
        
        {entry.description && (
          <div className="text-sm text-gray-700">{entry.description}</div>
        )}
      </div>
      
      {!readOnly && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default TimeEntryItem;
