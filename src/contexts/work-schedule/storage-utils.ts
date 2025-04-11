
import { WorkSchedule } from '@/types';
import { SCHEDULES_STORAGE_KEY, USER_SCHEDULES_STORAGE_KEY } from './types';
import { defaultWorkSchedule } from './defaultSchedule';
import { StorageOperations } from './internal-types';

export const createStorageOperations = (): StorageOperations => {
  const loadSchedules = (): WorkSchedule[] => {
    try {
      const savedSchedules = localStorage.getItem(SCHEDULES_STORAGE_KEY);
      if (savedSchedules) {
        return JSON.parse(savedSchedules);
      }
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
        return JSON.parse(savedUserSchedules);
      }
      return {};
    } catch (error) {
      console.error("Error loading user schedules from localStorage:", error);
      return {};
    }
  };

  const saveSchedules = (schedules: WorkSchedule[]): void => {
    try {
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error("Error saving schedules to localStorage:", error);
    }
  };

  const saveUserSchedules = (userSchedules: Record<string, string>): void => {
    try {
      localStorage.setItem(USER_SCHEDULES_STORAGE_KEY, JSON.stringify(userSchedules));
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
