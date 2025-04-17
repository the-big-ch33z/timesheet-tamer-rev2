
import { useState, useEffect } from 'react';
import { TimeEntry } from "@/types";
import { loadEntriesFromStorage } from '../timeEntryStorage';
import { useToast } from "@/hooks/use-toast";
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useInitialEntries');

/**
 * Hook to load initial entries from storage
 */
export const useInitialEntries = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Load entries on mount - only once
  useEffect(() => {
    if (isInitialized) return;
    
    try {
      logger.debug("[useInitialEntries] Loading initial entries");
      
      // Safely load entries with error handling
      let loadedEntries: TimeEntry[] = [];
      try {
        loadedEntries = loadEntriesFromStorage();
      } catch (error) {
        logger.error("[useInitialEntries] Error loading initial entries", error);
        // Continue with empty entries array instead of failing completely
      }
      
      setEntries(loadedEntries);
      logger.debug("[useInitialEntries] Loaded entries:", loadedEntries.length);
    } catch (error) {
      logger.error("[useInitialEntries] Error loading entries:", error);
      toast({
        title: "Error loading entries",
        description: "Your entries could not be loaded. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [toast, isInitialized]);

  return {
    entries,
    setEntries,
    isLoading,
    isInitialized
  };
};
