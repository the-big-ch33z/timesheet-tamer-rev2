
import { useLogger } from "@/hooks/useLogger";

export interface EntryActionsOptions {
  readOnly?: boolean;
  onDeleteEntry: (id: string) => void;
}

export const useEntryActions = () => {
  const logger = useLogger("EntryActions");
  
  // All functionality removed
  const handleDeleteEntry = () => {
    logger.info("Entry functionality has been removed");
  };

  return {
    handleDeleteEntry
  };
};
