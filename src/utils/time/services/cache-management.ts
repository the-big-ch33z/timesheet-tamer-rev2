
import { TimeEntry } from "@/types";
import { EntryCache } from "./types";
import { createTimeLogger } from "../errors/timeLogger";

const logger = createTimeLogger('cache-management');

/**
 * Create an empty cache object
 */
export const createEmptyCache = (): EntryCache => {
  return {
    entries: [],
    timestamp: Date.now(),
    valid: false
  };
};

/**
 * Check if the cache is valid based on configuration
 */
export const isCacheValid = (
  cache: EntryCache,
  enableCaching: boolean,
  cacheTTL: number
): boolean => {
  // If caching is disabled, always return false
  if (!enableCaching) {
    return false;
  }
  
  // If the cache is marked as invalid, return false
  if (!cache.valid) {
    return false;
  }
  
  // Check if the cache has expired
  const now = Date.now();
  const ageMs = now - cache.timestamp;
  
  return ageMs < cacheTTL;
};

/**
 * Invalidate the cache
 */
export const invalidateCache = (cache: EntryCache): EntryCache => {
  return {
    ...cache,
    valid: false
  };
};

/**
 * Update the cache with new entries
 */
export const updateCacheEntries = (
  cache: EntryCache,
  entries: TimeEntry[]
): EntryCache => {
  return {
    entries: [...entries],
    timestamp: Date.now(),
    valid: true
  };
};

/**
 * Get cached entries for a specific user
 */
export const getCachedUserEntries = (
  cache: EntryCache,
  userId: string,
  allEntries: TimeEntry[]
): TimeEntry[] => {
  if (!userId) {
    logger.warn('No userId provided to getCachedUserEntries');
    return [];
  }
  
  // Use cache if valid, otherwise filter the entries
  const entries = cache.valid ? cache.entries : allEntries;
  
  return entries.filter(entry => entry.userId === userId);
};

/**
 * Get cached entries for a specific day and user
 */
export const getCachedDayEntries = (
  cache: EntryCache,
  date: Date,
  userId: string,
  userEntries: TimeEntry[]
): TimeEntry[] => {
  if (!date || !userId) {
    logger.warn('Invalid date or userId provided to getCachedDayEntries');
    return [];
  }
  
  const dateString = date.toDateString();
  
  return userEntries.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return entryDate.toDateString() === dateString;
  });
};

/**
 * Get cached entries for a specific month and user
 */
export const getCachedMonthEntries = (
  cache: EntryCache,
  date: Date,
  userId: string,
  userEntries: TimeEntry[]
): TimeEntry[] => {
  if (!date || !userId) {
    logger.warn('Invalid date or userId provided to getCachedMonthEntries');
    return [];
  }
  
  const month = date.getMonth();
  const year = date.getFullYear();
  
  return userEntries.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return entryDate.getMonth() === month && entryDate.getFullYear() === year;
  });
};

export const updateUserEntries = (
  cache: EntryCache,
  userId: string,
  entries: TimeEntry[]
): EntryCache => {
  logger.debug(`Updating cache with ${entries.length} entries for user ${userId}`);
  return updateCacheEntries(cache, entries);
};

export const updateDayEntries = (
  cache: EntryCache,
  date: Date,
  userId: string,
  entries: TimeEntry[]
): EntryCache => {
  logger.debug(`Updating cache with ${entries.length} entries for date ${date.toISOString()} and user ${userId}`);
  return updateCacheEntries(cache, entries);
};

export const updateMonthEntries = (
  cache: EntryCache,
  date: Date,
  userId: string,
  entries: TimeEntry[]
): EntryCache => {
  logger.debug(`Updating cache with ${entries.length} entries for month ${date.toISOString().slice(0, 7)} and user ${userId}`);
  return updateCacheEntries(cache, entries);
};
