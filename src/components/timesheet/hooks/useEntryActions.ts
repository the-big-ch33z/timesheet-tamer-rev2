
import { useToast } from "@/hooks/use-toast";

export interface EntryActionsOptions {
  readOnly?: boolean;
  onDeleteEntry: (id: string) => void;
}

export const useEntryActions = ({ readOnly = false, onDeleteEntry }: EntryActionsOptions) => {
  const { toast } = useToast();
  
  const handleDeleteEntry = (id: string) => {
    // If in read-only mode, prevent deletion and show toast
    if (readOnly) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete entries from this timesheet",
        variant: "destructive"
      });
      return;
    }
    
    try {
      onDeleteEntry(id);
    } catch (error) {
      toast({
        title: "Error deleting entry",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return {
    handleDeleteEntry
  };
};
