
/**
 * This file provides a wrapper around the UnifiedTimeEntryService class
 * to export a singleton instance and consistent API with improved initialization
 */

import { UnifiedTimeEntryService, createTimeEntryService } from './time-entry-service';
import { TimeEntryServiceConfig } from './types';
import { STORAGE_KEY, DELETED_ENTRIES_KEY } from './storage-operations';
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('api-wrapper');

// Export all types and constants from the service for backward compatibility
export { 
  UnifiedTimeEntryService,
  createTimeEntryService,
  STORAGE_KEY, 
  DELETED_ENTRIES_KEY 
};

// Service initialization state
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;
let initializationRetries = 0;
const MAX_RETRIES = 3;

// Create and export a singleton instance with lazy initialization
export const unifiedTimeEntryService = createTimeEntryService({
  enableCaching: true,
  validateOnAccess: false, // Don't validate on access to reduce processing
  enableAuditing: true
});

/**
 * Safe initialization function with retry logic
 */
export const initializeService = async (): Promise<void> => {
  if (isInitialized) return;
  
  // If we already have a pending initialization, return that promise
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = new Promise<void>((resolve, reject) => {
    try {
      logger.debug(`Initializing service (attempt ${initializationRetries + 1})`);
      unifiedTimeEntryService.init();
      isInitialized = true;
      initializationRetries = 0;
      resolve();
    } catch (error) {
      logger.error('Service initialization error:', error);
      
      if (initializationRetries < MAX_RETRIES) {
        // Exponential backoff for retries
        const delay = Math.pow(2, initializationRetries) * 300;
        initializationRetries++;
        
        logger.debug(`Retrying initialization in ${delay}ms (attempt ${initializationRetries + 1})`);
        setTimeout(() => {
          initializationPromise = null;
          initializeService()
            .then(resolve)
            .catch(reject);
        }, delay);
      } else {
        logger.error(`Failed to initialize service after ${MAX_RETRIES} attempts`);
        reject(error);
      }
    }
  });
  
  return initializationPromise;
};

// Initialize service if we're in a browser environment
if (typeof window !== 'undefined') {
  initializeService().catch(err => {
    logger.error('Failed to initialize service during startup:', err);
  });
}

/**
 * Deprecated export for backward compatibility
 * @deprecated Use unifiedTimeEntryService instead
 */
export const timeEntryService = unifiedTimeEntryService;
