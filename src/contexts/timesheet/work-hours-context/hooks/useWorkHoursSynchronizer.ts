
import { useCallback } from 'react';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursSynchronizer');

interface UseWorkHoursSynchronizerProps {
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
}

export const useWorkHoursSynchronizer = ({
  setWorkHoursMap
}: UseWorkHoursSynchronizerProps) => {
  // Update the function signature to match the expected type in WorkHoursContextType
  const synchronizeFromRemote = useCallback(async (userId: string): Promise<void> => {
    // Placeholder for actual remote synchronization logic
    logger.info(`Synchronizing work hours for user ${userId}`);
    
    try {
      // Mock fetching remote data - in a real implementation, this would call an API
      const remoteData = []; // This would be data fetched from a remote source
      
      setWorkHoursMap(prevMap => {
        const updatedMap = new Map(prevMap);
        
        remoteData.forEach(remoteItem => {
          const key = `${remoteItem.userId}-${remoteItem.date}`;
          const localItem = updatedMap.get(key);
          
          if (!localItem || (remoteItem.lastModified > (localItem.lastModified || 0))) {
            updatedMap.set(key, {
              ...remoteItem,
              lastModified: remoteItem.lastModified || Date.now()
            });
          }
        });
        
        return updatedMap;
      });
    } catch (error) {
      logger.error(`Error synchronizing from remote: ${error}`);
    }
  }, []);

  return {
    synchronizeFromRemote
  };
};
