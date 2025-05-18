
import { WorkSchedule } from '@/types';
import { SCHEDULES_STORAGE_KEY, USER_SCHEDULES_STORAGE_KEY } from './types';
import { defaultWorkSchedule } from './defaultSchedule';
import { StorageOperations } from './internal-types';

/**
 * Version key to track storage format version and handle migrations
 */
const STORAGE_VERSION_KEY = 'workschedule-storage-version';
const CURRENT_VERSION = 1; // Increment when storage format changes

/**
 * Validate the user schedules format and fix if needed
 * @param userSchedules User schedules data to validate
 * @returns Validated and corrected user schedules
 */
const validateUserSchedules = (userSchedules: any): Record<string, string> => {
  if (!userSchedules || typeof userSchedules !== 'object') {
    return {};
  }
  
  const validatedSchedules: Record<string, string> = {};
  
  Object.entries(userSchedules).forEach(([userId, scheduleData]) => {
    // Handle nested schedules format
    if (typeof scheduleData === 'object' && scheduleData !== null) {
      // Extract first value from nested object
      const nestedValues = Object.values(scheduleData as Record<string, string>);
      if (nestedValues.length > 0 && typeof nestedValues[0] === 'string') {
        validatedSchedules[userId] = nestedValues[0];
        console.warn(`Fixed nested schedule format for user ${userId}`);
      }
    } 
    // Handle string schedules (correct format)
    else if (typeof scheduleData === 'string') {
      validatedSchedules[userId] = scheduleData;
    }
  });
  
  return validatedSchedules;
};

export const createStorageOperations = (): StorageOperations => {
  // Check storage version and run migrations if needed
  const checkStorageVersion = (): void => {
    try {
      const version = localStorage.getItem(STORAGE_VERSION_KEY);
      const currentVersion = version ? parseInt(version, 10) : 0;
      
      if (currentVersion < CURRENT_VERSION) {
        console.log(`Migrating work schedule storage from version ${currentVersion} to ${CURRENT_VERSION}`);
        
        // Run migrations based on version
        if (currentVersion < 1) {
          // Fix userSchedules format if needed
          const userSchedules = loadUserSchedules();
          saveUserSchedules(userSchedules); // This will save with the correct format
        }
        
        // Update version
        localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION.toString());
      }
    } catch (error) {
      console.error("Error checking storage version:", error);
    }
  };

  const loadSchedules = (): WorkSchedule[] => {
    try {
      // Check storage version first
      checkStorageVersion();
      
      const savedSchedules = localStorage.getItem(SCHEDULES_STORAGE_KEY);
      if (savedSchedules) {
        const parsedSchedules = JSON.parse(savedSchedules);
        // Ensure the default schedule exists in the parsed schedules
        if (!parsedSchedules.some((s: WorkSchedule) => s.id === 'default')) {
          console.log("Default schedule not found in storage, adding it");
          return [defaultWorkSchedule, ...parsedSchedules];
        }
        return parsedSchedules;
      }
      
      // If no schedules found, return just the default schedule
      console.log("No schedules found in storage, creating default schedule");
      return [defaultWorkSchedule];
    } catch (error) {
      console.error("Error loading schedules from localStorage:", error);
      return [defaultWorkSchedule];
    }
  };

  const loadUserSchedules = (): Record<string, string> => {
    try {
      const savedUserSchedules = localStorage.getItem(USER_SCHEDULES_STORAGE_KEY);
      if (savedUserSchedules) {
        const parsedSchedules = JSON.parse(savedUserSchedules);
        // Validate and fix format if needed
        return validateUserSchedules(parsedSchedules);
      }
      return {};
    } catch (error) {
      console.error("Error loading user schedules from localStorage:", error);
      return {};
    }
  };

  const saveSchedules = (schedules: WorkSchedule[]): void => {
    try {
      // Ensure the default schedule is always included
      if (!schedules.some(s => s.id === 'default')) {
        schedules = [defaultWorkSchedule, ...schedules];
      }
      
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error("Error saving schedules to localStorage:", error);
    }
  };

  const saveUserSchedules = (userSchedules: Record<string, string>): void => {
    try {
      // Validate format before saving
      const validatedSchedules = validateUserSchedules(userSchedules);
      localStorage.setItem(USER_SCHEDULES_STORAGE_KEY, JSON.stringify(validatedSchedules));
    } catch (error) {
      console.error("Error saving user schedules to localStorage:", error);
    }
  };

  return {
    loadSchedules,
    loadUserSchedules,
    saveSchedules,
    saveUserSchedules
  };
};
