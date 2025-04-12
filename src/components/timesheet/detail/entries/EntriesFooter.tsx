
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TimeEntry } from "@/types";

interface EntriesFooterProps {
  entries: TimeEntry[];
  readOnly: boolean;
  isAddingEntry: boolean;
  onAddEntry: () => void;
}

const EntriesFooter: React.FC<EntriesFooterProps> = ({
  entries,
  readOnly,
  isAddingEntry,
  onAddEntry
}) => {
  // Show green "+ Add Entry" button when there are entries and not currently adding one
  if (readOnly || isAddingEntry) {
    return null;
  }

  // Only show after at least one entry exists
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center mt-4">
      <Button 
        variant="outline" 
        onClick={onAddEntry}
        className="w-full max-w-xs border-dashed bg-green-500 hover:bg-green-600 text-white"
      >
        <Plus className="h-4 w-4 mr-1" /> Add Entry
      </Button>
    </div>
  );
};

export default EntriesFooter;
