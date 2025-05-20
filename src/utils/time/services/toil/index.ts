
/**
 * Main TOIL service export file
 * Re-exports everything from the TOIL service
 */

import { TOILService, toilService } from './service/main';
import { clearSummaryCache } from './storage';
import { createTimeLogger } from '@/utils/time/errors';
import { format } from 'date-fns';
import { initializeTOILEntryEventHandlers } from './entryEventHandler';
import { unifiedTOILEventService } from './unifiedEventService';

const logger = createTimeLogger('TOIL-Service');

// Initialize TOIL service when imported
try {
  toilService.initialize();
  logger.debug('TOIL service initialized on import');
  
  // Initialize TOIL entry event handlers
  if (typeof window !== 'undefined') {
    initializeTOILEntryEventHandlers();
    logger.debug('TOIL entry event handlers initialized');
  }
} catch (e) {
  logger.error('Failed to initialize TOIL service:', e);
}

// Re-export everything from the TOIL modules
export * from './calculation';
export * from './queue';
export * from './storage';
export * from './events';
export * from './service/main';
export * from './service/core';
export * from './entryEventHandler';  // Export the new event handler
export * from './unifiedEventService';  // Export the unified event service

// Re-export the toilService singleton instance directly
export { toilService };

// Track the last time we cleared the cache to prevent excessive clearing
let lastCacheClearTime = 0;
const CACHE_CLEAR_THROTTLE = 5000; // 5 seconds

/**
 * Add a more selective cache clearing function
 * Avoid clearing caches too frequently or when not needed
 */
export function clearCache(userId?: string, monthYear?: string) {
  try {
    const now = Date.now();
    
    // Throttle cache clearing operations
    if (now - lastCacheClearTime < CACHE_CLEAR_THROTTLE) {
      logger.debug('Cache clearing throttled - ignoring request');
      return false;
    }
    
    lastCacheClearTime = now;
    
    if (userId && monthYear) {
      // Selective cache clearing - only clear for specified user and month
      logger.debug(`Selective cache clearing for user ${userId}, month ${monthYear}`);
      clearSummaryCache(userId, monthYear);
    } else {
      // Broader but still controlled cache clearing
      logger.debug('Broader cache clearing requested');
      clearSummaryCache();
    }
    
    // Also invalidate any in-memory caches
    toilService.clearCache();
    
    logger.debug('TOIL caches cleared');
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

// Add debug utilities
export function getDebugInfo() {
  return {
    serviceInitialized: toilService.isInitialized(),
    queueLength: toilService.getQueueLength(),
    isQueueProcessing: toilService.isQueueProcessing(),
    lastCacheClear: new Date(lastCacheClearTime).toISOString(),
    unifiedEventServiceInitialized: !!unifiedTOILEventService
  };
}

// Export unified service directly for easier access
export { unifiedTOILEventService };

// Module initialization marker
logger.debug('TOIL service module initialized with unified event handling');
