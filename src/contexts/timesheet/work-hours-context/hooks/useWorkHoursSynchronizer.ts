
import { useCallback } from 'react';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursSynchronizer');

interface UseWorkHoursSynchronizerProps {
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
}

export const useWorkHoursSynchronizer = ({
  setWorkHoursMap
}: UseWorkHoursSynchronizerProps) => {
  const synchronizeFromRemote = useCallback((remoteData: any[]): void => {
    logger.info(`Synchronizing with ${remoteData.length} remote entries`);
    
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
  }, []);

  return {
    synchronizeFromRemote
  };
};
