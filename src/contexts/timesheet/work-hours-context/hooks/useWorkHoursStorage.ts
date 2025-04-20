
import { useEffect } from 'react';
import { WorkHoursData } from '../types';
import { workHoursStorage } from '../workHoursStorage';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursStorage');

interface UseWorkHoursStorageProps {
  workHoursMap: Map<string, WorkHoursData>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, WorkHoursData>>>;
  latestWorkHoursRef: React.MutableRefObject<Map<string, WorkHoursData>>;
  saveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isInitializedRef: React.MutableRefObject<boolean>;
}

export const useWorkHoursStorage = ({
  workHoursMap,
  setWorkHoursMap,
  latestWorkHoursRef,
  saveTimeoutRef,
  isInitializedRef
}: UseWorkHoursStorageProps) => {
  // Save to storage when data changes
  useEffect(() => {
    if (workHoursMap.size > 0 && isInitializedRef.current) {
      latestWorkHoursRef.current = workHoursMap;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        workHoursStorage.saveWorkHours(workHoursMap);
        saveTimeoutRef.current = null;
      }, 300);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workHoursMap]);

  // Handle storage events for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'timesheet-work-hours' && event.newValue) {
        try {
          logger.debug('Storage change detected, updating local state');
          
          const newData: WorkHoursData[] = JSON.parse(event.newValue);
          
          setWorkHoursMap(prevMap => {
            const updatedMap = new Map(prevMap);
            
            newData.forEach(item => {
              const key = `${item.userId}-${item.date}`;
              const currentItem = updatedMap.get(key);
              
              if (!currentItem || (item.lastModified > currentItem.lastModified)) {
                updatedMap.set(key, item);
              }
            });
            
            return updatedMap;
          });
        } catch (error) {
          logger.error('Error handling storage change:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle unload events
  useEffect(() => {
    const handleUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      try {
        const dataArray = Array.from(latestWorkHoursRef.current.values());
        localStorage.setItem('timesheet-work-hours', JSON.stringify(dataArray));
        logger.debug(`Saved ${dataArray.length} work hours entries on page unload`);
      } catch (error) {
        logger.error('Error saving work hours on unload:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);
};
