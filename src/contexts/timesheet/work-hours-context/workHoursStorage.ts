
import { WorkHoursData } from './types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('WorkHoursStorage');

// Storage key for localStorage
const STORAGE_KEY = 'timesheet-work-hours';

// Cache for in-memory data
let inMemoryData: WorkHoursData[] | null = null;
let saveTimer: NodeJS.Timeout | null = null;
const SAVE_DELAY = 600; // ms to wait before saving to localStorage

export const workHoursStorage = {
  loadWorkHours: (): Map<string, WorkHoursData> => {
    try {
      // Use cache if available to avoid localStorage reads
      if (inMemoryData) {
        logger.debug('Using cached work hours data');
        const newMap = new Map<string, WorkHoursData>();
        
        inMemoryData.forEach(item => {
          const key = `${item.userId}-${item.date}`;
          newMap.set(key, item);
        });
        
        return newMap;
      }
      
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData: WorkHoursData[] = JSON.parse(savedData);
        const newMap = new Map<string, WorkHoursData>();
        
        parsedData.forEach(item => {
          const key = `${item.userId}-${item.date}`;
          item.isCustom = item.isCustom !== undefined ? item.isCustom : true;
          item.lastModified = item.lastModified || Date.now();
          newMap.set(key, item);
        });
        
        // Cache the loaded data
        inMemoryData = parsedData;
        
        logger.debug(`Loaded ${parsedData.length} work hours entries from storage`);
        return newMap;
      }
    } catch (error) {
      logger.error('Error loading work hours from storage:', error);
    }
    return new Map();
  },

  saveWorkHours: (data: Map<string, WorkHoursData>): void => {
    try {
      const dataArray = Array.from(data.values());
      
      // Cache immediately in memory
      inMemoryData = [...dataArray];
      
      // Debounce the localStorage write
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      
      saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataArray));
          logger.debug(`Saved ${dataArray.length} work hours entries to storage`);
        } catch (error) {
          logger.error('Error writing to localStorage:', error);
        }
        saveTimer = null;
      }, SAVE_DELAY);
    } catch (error) {
      logger.error('Error preparing work hours for storage:', error);
    }
  },
  
  clearCache: () => {
    inMemoryData = null;
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  },
  
  forceSync: () => {
    if (inMemoryData && !saveTimer) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryData));
        logger.debug('Forced work hours sync to localStorage');
      } catch (error) {
        logger.error('Error during forced sync:', error);
      }
    }
  }
};
