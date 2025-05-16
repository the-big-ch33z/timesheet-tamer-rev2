
import { timeEntryService } from './time-entry-service';
import { toilService } from './toil/service';
import { createTimeLogger } from '../errors';

const logger = createTimeLogger('TimeServiceInitializer');

/**
 * Track initialization status
 */
let isInitialized = false;
let initializationError: Error | null = null;

/**
 * Initialize all time-related services in the correct order
 * This ensures dependencies are properly set up before use
 */
export const initializeService = async (): Promise<void> => {
  if (isInitialized) {
    logger.debug("Services already initialized");
    return;
  }
  
  try {
    logger.debug("Beginning service initialization");
    
    // Initialize timeEntryService first
    timeEntryService.init();
    logger.debug("Time entry service initialized");
    
    // Then initialize the TOIL service which depends on time entries
    toilService.initialize();
    logger.debug("TOIL service initialized");
    
    isInitialized = true;
    initializationError = null;
    logger.debug("All time services successfully initialized");
  } catch (error) {
    initializationError = error instanceof Error 
      ? error
      : new Error('Unknown error during service initialization');
    
    logger.error("Service initialization failed:", error);
    throw initializationError;
  }
};

/**
 * Check if services have been initialized
 */
export const areServicesInitialized = (): boolean => {
  return isInitialized;
};

/**
 * Get any initialization error that occurred
 */
export const getInitializationError = (): Error | null => {
  return initializationError;
};

/**
 * Reset initialization status (for testing)
 */
export const resetInitialization = (): void => {
  isInitialized = false;
  initializationError = null;
};
