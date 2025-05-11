
import { TimeEntry } from "@/types";
import { EntryCache } from "./types";
import { createTimeLogger } from "../errors/timeLogger";

const logger = createTimeLogger('TimeEntryCache');

/**
 * Create an empty cache object
 */
export function createEmptyCache(): EntryCache {
  return {
    entries: [],
    userEntries: {},
    dayEntries: {},
    monthEntries: {},
    timestamp: 0,
    isValid: false
  };
}

/**
 * Check if cache is still valid based on TTL
 */
export function isCacheValid(
  cache: EntryCache,
  enableCaching: boolean,
  cacheTTL: number
): boolean {
  if (!enableCaching) return false;
  if (!cache || !cache.isValid) return false;
  
  const now = Date.now();
  return (now - cache.timestamp) < cacheTTL;
}

/**
 * Reset cache to empty state
 */
export function invalidateCache(cache: EntryCache): EntryCache {
  return {
    ...cache,
    isValid: false,
    timestamp: 0,
    userEntries: {},
    dayEntries: {},
    monthEntries: {}
  };
}

/**
 * Update cache with new entries
 */
export function updateCacheEntries(
  cache: EntryCache,
  entries: TimeEntry[]
): EntryCache {
  return {
    ...cache,
    entries: [...entries],
    timestamp: Date.now(),
    isValid: true
  };
}

/**
 * Get cached entries for a specific user
 */
export function getCachedUserEntries(
  cache: EntryCache,
  userId: string,
  allEntries: TimeEntry[]
): TimeEntry[] {
  if (cache.userEntries[userId]) {
    logger.debug(`Using cached entries for user ${userId}`);
    return [...cache.userEntries[userId]];
  }
  
  // Filter entries for the user
  const userEntries = allEntries.filter(entry => entry.userId === userId);
  
  // Update cache
  cache.userEntries[userId] = userEntries;
  
  logger.debug(`Cached ${userEntries.length} entries for user ${userId}`);
  return [...userEntries];
}

/**
 * Get cached entries for a specific day and user
 */
export function getCachedDayEntries(
  cache: EntryCache,
  date: Date,
  userId: string,
  userEntries: TimeEntry[]
): TimeEntry[] {
  // Generate cache key
  const cacheKey = `${userId}-${date.toDateString()}`;
  
  // Check cache first
  if (cache.dayEntries[cacheKey]) {
    logger.debug(`Using cached entries for day ${date.toDateString()}`);
    return [...cache.dayEntries[cacheKey]];
  }
  
  // Filter by date
  const dayEntries = userEntries.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return entryDate.toDateString() === date.toDateString();
  });
  
  // Update cache
  cache.dayEntries[cacheKey] = dayEntries;
  
  logger.debug(`Cached ${dayEntries.length} entries for user ${userId} on ${date.toDateString()}`);
  return [...dayEntries];
}

/**
 * Get cached entries for a specific month and user
 */
export function getCachedMonthEntries(
  cache: EntryCache,
  date: Date,
  userId: string,
  userEntries: TimeEntry[]
): TimeEntry[] {
  // Generate cache key
  const cacheKey = `${userId}-${date.getFullYear()}-${date.getMonth()}`;
  
  // Check cache first
  if (cache.monthEntries[cacheKey]) {
    logger.debug(`Using cached entries for month ${date.getFullYear()}-${date.getMonth() + 1}`);
    return [...cache.monthEntries[cacheKey]];
  }
  
  // Filter by month
  const monthEntries = userEntries.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return (
      entryDate.getMonth() === date.getMonth() && 
      entryDate.getFullYear() === date.getFullYear()
    );
  });
  
  // Update cache
  cache.monthEntries[cacheKey] = monthEntries;
  
  logger.debug(`Cached ${monthEntries.length} entries for month ${date.getFullYear()}-${date.getMonth() + 1}`);
  return [...monthEntries];
}
