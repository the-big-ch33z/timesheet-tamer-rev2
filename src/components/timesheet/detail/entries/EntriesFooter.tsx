
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
  // Only show the footer button if there are entries, it's not read-only, and not currently adding an entry
  if (readOnly || entries.length === 0 || isAddingEntry) {
    return null;
  }

  return (
    <div className="flex justify-center mt-4">
      <Button 
        variant="outline" 
        onClick={onAddEntry}
        className="w-full max-w-xs border-dashed"
      >
        <Plus className="h-4 w-4 mr-1" /> Add Another Entry
      </Button>
    </div>
  );
};

export default EntriesFooter;
