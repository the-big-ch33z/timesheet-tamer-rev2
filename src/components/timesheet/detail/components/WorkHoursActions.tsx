
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface WorkHoursActionsProps {
  onAddEntry: () => void;
}

/**
 * Component for displaying the Add Entry button
 */
const WorkHoursActions: React.FC<WorkHoursActionsProps> = ({
  onAddEntry
}) => {
  return (
    <div className="flex space-x-2 mb-4">
      <Button 
        size="sm"
        className="bg-green-500 hover:bg-green-600 text-white"
        onClick={onAddEntry}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Entry
      </Button>
    </div>
  );
};

export default WorkHoursActions;
