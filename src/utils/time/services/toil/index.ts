
/**
 * Main TOIL service export file
 * Re-exports everything from the TOIL service
 */

import { TOILService, toilService } from './service/main';
import { clearSummaryCache } from './storage';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOIL-Service');

// Initialize TOIL service when imported
try {
  toilService.initialize();
  logger.debug('TOIL service initialized on import');
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

// Re-export the toilService singleton instance directly
export { toilService };

// Add a more aggressive cache clearing function
export function clearCache() {
  try {
    logger.debug('Aggressive cache clearing requested');
    // Clear cache in local storage
    clearSummaryCache();
    
    // Also invalidate any in-memory caches
    toilService.clearCache();
    
    logger.debug('All TOIL caches cleared');
    return true;
  } catch (e) {
    logger.error('Error clearing TOIL caches:', e);
    return false;
  }
}

// Add debug utilities
export function getDebugInfo() {
  return {
    serviceInitialized: toilService.isInitialized(),
    queueLength: toilService.getQueueLength(),
    isQueueProcessing: toilService.isQueueProcessing()
  };
}

// Module initialization marker
logger.debug('TOIL service module initialized');

