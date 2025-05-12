
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
        onClick={onAddEntry} 
        variant="outline" 
        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Entry
      </Button>
    </div>
  );
};

export default WorkHoursActions;
