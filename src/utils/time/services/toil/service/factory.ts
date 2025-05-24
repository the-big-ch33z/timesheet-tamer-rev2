
import { TOILService } from "./main";
import { createTimeLogger } from "@/utils/time/errors";
import { TOILServiceInitializer } from "./initializer";

const logger = createTimeLogger('TOILService-Factory');

/**
 * Singleton instance of the TOILService
 */
export const toilService = new TOILService();

/**
 * Track initialization state to prevent duplicate calls
 */
let isInitializing = false;
let isInitialized = false;

/**
 * Initialize the TOIL service
 * This function should be called when the application is ready
 */
export function initializeTOILService(): void {
  // Prevent concurrent initialization attempts
  if (isInitializing || isInitialized) {
    logger.debug('TOIL service initialization already in progress or completed');
    return;
  }
  
  isInitializing = true;
  
  try {
    logger.debug('Initializing TOIL service...');
    
    // Use singleton initializer to prevent duplicate instances
    const initializer = TOILServiceInitializer.getInstance();
    initializer.initialize();
    
    // Initialize the main service
    toilService.initialize();
    
    isInitialized = true;
    logger.debug('TOIL service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize TOIL service:', error);
    isInitialized = false;
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Check if TOIL service is initialized
 */
export function isToilServiceInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset initialization state for recovery
 */
export function resetToilService(): void {
  isInitializing = false;
  isInitialized = false;
  TOILServiceInitializer.getInstance().reset();
  logger.debug('TOIL service factory reset');
}
