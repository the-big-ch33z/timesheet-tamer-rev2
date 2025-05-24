
/**
 * Main TOIL service export file
 * Re-exports everything from the TOIL service
 */

import { toilService, initializeTOILService } from './service/factory';
import { clearSummaryCache } from './storage';
import { createTimeLogger } from '@/utils/time/errors';
import { format } from 'date-fns';
import { initializeTOILEntryEventHandlers } from './entryEventHandler';
import { unifiedTOILEventService } from './unifiedEventService';

const logger = createTimeLogger('TOIL-Service');

// Initialize TOIL service when imported
try {
  initializeTOILService();
  logger.debug('TOIL service initialized on import');
  
  // Initialize TOIL entry event handlers
  if (typeof window !== 'undefined') {
    initializeTOILEntryEventHandlers();
    logger.debug('TOIL entry event handlers initialized');
  }
} catch (e) {
  logger.error('Failed to initialize TOIL service:', e);
}

// Re-export everything from the TOIL modules EXCEPT for the conflicting functions
export * from './calculation';
export * from './queue';
export * from './storage';
export * from './service/main';
export * from './service/core';
export * from './entryEventHandler';  // Export the new event handler

// Re-export the unified event service and its functions - this replaces './events' exports
export {
  unifiedTOILEventService,
  createTOILUpdateHandler,
  dispatchTOILEvent,
  dispatchTOILSummaryEvent
} from './unifiedEventService';

// Re-export the toilService singleton instance directly
export { toilService };

// Track the last time we cleared the cache to prevent excessive clearing
let lastCacheClearTime = 0;
const CACHE_CLEAR_THROTTLE = 30000; // Increased to 30 seconds to be less aggressive

/**
 * More selective cache clearing function
 * Only clears when absolutely necessary and with proper throttling
 */
export function clearCache(userId?: string, monthYear?: string) {
  try {
    const now = Date.now();
    
    // Throttle cache clearing operations more aggressively
    if (now - lastCacheClearTime < CACHE_CLEAR_THROTTLE) {
      logger.debug('Cache clearing throttled - ignoring request (too frequent)');
      return false;
    }
    
    lastCacheClearTime = now;
    
    if (userId && monthYear) {
      // Selective cache clearing - only clear for specified user and month
      logger.debug(`Selective cache clearing for user ${userId}, month ${monthYear}`);
      clearSummaryCache(userId, monthYear);
    } else {
      // Only clear when explicitly requested, not automatically
      logger.warn('Broad cache clearing requested - this should be rare');
      clearSummaryCache();
    }
    
    // Also invalidate any in-memory caches
    toilService.clearCache();
    
    logger.debug('TOIL caches cleared selectively');
    return true;
  } catch (e) {
    logger.error('Error clearing TOIL caches:', e);
    return false;
  }
}

/**
 * Clear cache only for a specific time period
 * Used for more targeted cache invalidation
 */
export function clearCacheForCurrentMonth(userId: string, date: Date) {
  const monthYear = format(date, 'yyyy-MM');
  return clearCache(userId, monthYear);
}

/**
 * Validate cache before clearing - only clear if data is stale
 */
export function validateAndClearCache(userId: string, monthYear: string) {
  try {
    // Check if we have valid cached data first
    const summary = toilService.getTOILSummary(userId, monthYear);
    
    // Only clear if we don't have valid data or it's explicitly stale
    if (!summary || summary.accrued === 0) {
      logger.debug(`Clearing stale cache for ${userId} in ${monthYear}`);
      return clearCache(userId, monthYear);
    } else {
      logger.debug(`Cache is valid for ${userId} in ${monthYear}, preserving`);
      return false;
    }
  } catch (e) {
    logger.error('Error validating cache:', e);
    return false;
  }
}

// Add debug utilities
export function getDebugInfo() {
  return {
    serviceInitialized: toilService.isInitialized(),
    queueLength: toilService.getQueueLength(),
    isQueueProcessing: toilService.isQueueProcessing(),
    lastCacheClear: new Date(lastCacheClearTime).toISOString(),
    unifiedEventServiceInitialized: !!unifiedTOILEventService,
    cacheThrottleMs: CACHE_CLEAR_THROTTLE
  };
}

// Module initialization marker
logger.debug('TOIL service module initialized with selective cache management');
