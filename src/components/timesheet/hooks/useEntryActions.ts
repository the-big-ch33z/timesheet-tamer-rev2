
import { useLogger } from "@/hooks/useLogger";

export interface EntryActionsOptions {
  readOnly?: boolean;
  onDeleteEntry: (id: string) => void;
}

export const useEntryActions = ({ readOnly = false }: EntryActionsOptions) => {
  const logger = useLogger("EntryActions");
  
  // Simplified function that logs but doesn't actually do anything
  const handleDeleteEntry = (id: string) => {
    logger.info("Entry deletion is no longer supported", { id });
  };

  return {
    handleDeleteEntry
  };
};
