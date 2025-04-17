
import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Plus } from "lucide-react";

interface WorkHoursActionsProps {
  onAddTime?: () => void;
  onSaveAll?: () => boolean;
  hasQuickAdd?: boolean;
}

/**
 * Component for displaying work hours action buttons
 */
const WorkHoursActions: React.FC<WorkHoursActionsProps> = ({
  onAddTime,
  onSaveAll,
  hasQuickAdd = false
}) => {
  return (
    <div className="flex space-x-2 mb-4">
      {hasQuickAdd && onAddTime && (
        <Button 
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white"
          onClick={onAddTime}
        >
          <Plus className="h-4 w-4 mr-1" />
          Quick Add
        </Button>
      )}
      
      {onSaveAll && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={onSaveAll}
        >
          <Save className="h-4 w-4 mr-1" />
          Save All
        </Button>
      )}
    </div>
  );
};

export default WorkHoursActions;
