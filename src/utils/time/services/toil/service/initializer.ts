
import { createTimeLogger } from "@/utils/time/errors";
import { toilQueueManager } from "../queue/TOILQueueManager";
import { clearSummaryCache } from "../storage";

const logger = createTimeLogger('TOILService-Initializer');

/**
 * Handles initialization and lifecycle concerns for TOIL services
 */
export class TOILServiceInitializer {
  private initialized: boolean = false;
  private initializationError: Error | null = null;
  
  /**
   * Initialize the TOIL service and dependent components
   */
  public initialize(): void {
    if (this.initialized) {
      logger.debug('TOILService already initialized');
      return;
    }
    
    try {
      logger.debug('Initializing TOILService and dependent components');
      
      // Clear any stored cache on initialization
      this.clearCache();
      
      // Initialize the queue manager now that all dependencies are ready
      toilQueueManager.initialize();
      
      this.initialized = true;
      this.initializationError = null;
      logger.debug('TOILService fully initialized');
    } catch (error) {
      logger.error('Error initializing TOILService:', error);
      this.initializationError = error instanceof Error 
        ? error 
        : new Error('Failed to initialize TOIL service: ' + String(error));
      throw this.initializationError;
    }
  }
  
  /**
   * Check if the service is fully initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get the error that occurred during initialization, if any
   */
  public getInitializationError(): Error | null {
    return this.initializationError;
  }
  
  /**
   * Clear all caches
   */
  public clearCache(): void {
    try {
      logger.debug('Clearing all TOIL caches');
      clearSummaryCache(); // Pass no parameters to clear all caches
      logger.debug('Cache cleared successfully');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }
}
