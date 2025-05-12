
import { WorkHoursData } from '../types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('WorkHoursStorage');

// Storage key for localStorage
const STORAGE_KEY = 'timesheet-work-hours';

export const workHoursStorage = {
  loadWorkHours: (): Map<string, WorkHoursData> => {
    try {
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataArray));
      logger.debug(`Saved ${dataArray.length} work hours entries to storage`);
    } catch (error) {
      logger.error('Error saving work hours to storage:', error);
    }
  }
};
