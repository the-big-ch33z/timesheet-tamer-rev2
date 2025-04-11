
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface TimeEntryFormButtonsProps {
  onSave: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  entryId?: string;
  inline?: boolean;
  disabled?: boolean;
}

const TimeEntryFormButtons: React.FC<TimeEntryFormButtonsProps> = ({
  onSave,
  onCancel,
  onDelete,
  entryId,
  inline = false,
  disabled = false
}) => {
  // For inline form with delete option
  if (inline && onDelete && entryId) {
    return (
      <Button 
        type="button" 
        variant="ghost" 
        size="icon"
        onClick={() => onDelete(entryId)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  }
  
  // For regular form with save/cancel buttons
  if (!inline) {
    return (
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={disabled}>
          Save Entry
        </Button>
      </div>
    );
  }
  
  return null;
};

export default TimeEntryFormButtons;
