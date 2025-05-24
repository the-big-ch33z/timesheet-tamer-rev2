
/**
 * Main TOIL service export file
 * Re-exports everything from the TOIL service
 */

import { toilService, initializeTOILService, isToilServiceInitialized } from './service/factory';
import { clearSummaryCache } from './storage';
import { createTimeLogger } from '@/utils/time/errors';
import { format } from 'date-fns';
import { initializeTOILEntryEventHandlers } from './entryEventHandler';
import { unifiedTOILEventService } from './unifiedEventService';

const logger = createTimeLogger('TOIL-Service');

// Initialize TOIL service when imported (with error recovery)
try {
  if (!isToilServiceInitialized()) {
    initializeTOILService();
    logger.debug('TOIL service initialized on import');
    
    // Initialize TOIL entry event handlers only in browser environment
    if (typeof window !== 'undefined') {
      initializeTOILEntryEventHandlers();
      logger.debug('TOIL entry event handlers initialized');
    }
  }
} catch (e) {
  logger.error('Failed to initialize TOIL service:', e);
  // Don't throw here to prevent breaking the entire module
}

// Re-export everything from the TOIL modules
export * from './calculation';
export * from './queue';
export * from './storage';
export * from './service/main';
export * from './service/core';
export * from './entryEventHandler';

// Re-export the unified event service and its functions
export {
  unifiedTOILEventService,
  createTOILUpdateHandler,
  dispatchTOILEvent,
  dispatchTOILSummaryEvent
} from './unifiedEventService';

// Re-export the toilService singleton instance directly
export { toilService, isToilServiceInitialized, resetToilService } from './service/factory';

// Track the last time we cleared the cache to prevent excessive clearing
let lastCacheClearTime = 0;
const CACHE_CLEAR_THROTTLE = 30000; // 30 seconds

/**
 * More selective cache clearing function with validation
 */
export function clearCache(userId?: string, monthYear?: string) {
  try {
    const now = Date.now();
    
    // Throttle cache clearing operations
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
    if (isToilServiceInitialized()) {
      toilService.clearCache();
    }
    
    logger.debug('TOIL caches cleared selectively');
    return true;
  } catch (e) {
    logger.error('Error clearing TOIL caches:', e);
    return false;
  }
}

/**
 * Clear cache only for a specific time period
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
    if (!isToilServiceInitialized()) {
      logger.debug('TOIL service not initialized, skipping cache validation');
      return false;
    }
    
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
    serviceInitialized: isToilServiceInitialized(),
    queueLength: isToilServiceInitialized() ? toilService.getQueueLength() : 0,
    isQueueProcessing: isToilServiceInitialized() ? toilService.isQueueProcessing() : false,
    lastCacheClear: new Date(lastCacheClearTime).toISOString(),
    unifiedEventServiceInitialized: !!unifiedTOILEventService,
    cacheThrottleMs: CACHE_CLEAR_THROTTLE
  };
}

// Module initialization marker
logger.debug('TOIL service module initialized with error recovery and selective cache management');
