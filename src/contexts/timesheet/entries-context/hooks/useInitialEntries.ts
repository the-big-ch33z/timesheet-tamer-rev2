
import { useState, useEffect } from 'react';
import { TimeEntry } from '@/types';
import { loadEntriesFromStorage } from '../timeEntryStorage';
import { useLogger } from '@/hooks/useLogger';

/**
 * Hook for loading initial entries from storage
 */
export const useInitialEntries = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const logger = useLogger('useInitialEntries');

  // Load initial entries from storage
  useEffect(() => {
    try {
      logger.debug('Loading initial entries from storage');
      const loadedEntries = loadEntriesFromStorage();
      setEntries(loadedEntries);
      setIsInitialized(true);
    } catch (error) {
      logger.error('Error loading initial entries', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    entries,
    setEntries,
    isLoading,
    isInitialized
  };
};
