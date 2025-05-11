
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
 * Update the cache with user entries
 */
export const updateUserEntries = (
  cache: EntryCache,
  userId: string,
  entries: TimeEntry[]
): EntryCache => {
  // For now we just store all entries in the main entries array
  // In a future optimization, we could store per-user entries separately
  logger.debug(`Updating cache with ${entries.length} entries for user ${userId}`);
  return updateCacheEntries(cache, entries);
};

/**
 * Update day entries in the cache
 */
export const updateDayEntries = (
  cache: EntryCache,
  date: Date,
  userId: string,
  entries: TimeEntry[]
): EntryCache => {
  // For now, we're just updating all entries
  // In a future optimization, we could store day entries separately
  logger.debug(`Updating cache with ${entries.length} entries for date ${date.toISOString()} and user ${userId}`);
  return updateCacheEntries(cache, entries);
};

/**
 * Update month entries in the cache
 */
export const updateMonthEntries = (
  cache: EntryCache,
  date: Date,
  userId: string,
  entries: TimeEntry[]
): EntryCache => {
  // For now, we're just updating all entries
  // In a future optimization, we could store month entries separately
  logger.debug(`Updating cache with ${entries.length} entries for month ${date.toISOString().slice(0, 7)} and user ${userId}`);
  return updateCacheEntries(cache, entries);
};
