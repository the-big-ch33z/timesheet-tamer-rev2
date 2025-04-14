
import { useState, useEffect } from 'react';
import { TimeEntry } from "@/types";
import { loadEntriesFromStorage } from '../timeEntryStorage';
import { useToast } from "@/hooks/use-toast";

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
      console.debug("[TimeEntryProvider] Loading initial entries");
      const loadedEntries = loadEntriesFromStorage();
      setEntries(loadedEntries);
      console.debug("[TimeEntryProvider] Loaded entries:", loadedEntries.length);
    } catch (error) {
      console.error("[TimeEntryProvider] Error loading entries:", error);
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
