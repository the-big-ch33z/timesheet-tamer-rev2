
import { useToast } from "@/hooks/use-toast";
import { useLogger } from "@/hooks/useLogger";

export interface EntryActionsOptions {
  readOnly?: boolean;
  onDeleteEntry: (id: string) => void;
}

export const useEntryActions = ({ readOnly = false, onDeleteEntry }: EntryActionsOptions) => {
  const { toast } = useToast();
  const logger = useLogger("EntryActions");
  
  const handleDeleteEntry = (id: string) => {
    // If in read-only mode, prevent deletion and show toast
    if (readOnly) {
      logger.warn("Attempted to delete entry in read-only mode", { id });
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete entries from this timesheet",
        variant: "destructive"
      });
      return;
    }
    
    try {
      logger.info("Deleting entry", { id });
      
      // Call the delete function
      onDeleteEntry(id);
      
      // Show success toast
      toast({
        title: "Entry deleted",
        description: "Time entry has been successfully removed",
      });
      
      logger.info("Entry successfully deleted", { id });
    } catch (error) {
      logger.error("Failed to delete entry", { id, error });
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
