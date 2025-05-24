
import { createTimeLogger } from "@/utils/time/errors";
import { toilQueueManager } from "../queue/TOILQueueManager";
import { clearSummaryCache } from "../storage";

const logger = createTimeLogger('TOILService-Initializer');

/**
 * Handles initialization and lifecycle concerns for TOIL services
 */
export class TOILServiceInitializer {
  private static instance: TOILServiceInitializer | null = null;
  private initialized: boolean = false;
  private initializationError: Error | null = null;
  private initializationAttempts: number = 0;
  private readonly MAX_INIT_ATTEMPTS = 3;
  private readonly INIT_RETRY_DELAY = 1000; // 1 second
  
  /**
   * Get singleton instance
   */
  public static getInstance(): TOILServiceInitializer {
    if (!TOILServiceInitializer.instance) {
      TOILServiceInitializer.instance = new TOILServiceInitializer();
    }
    return TOILServiceInitializer.instance;
  }
  
  /**
   * Initialize the TOIL service and dependent components
   */
  public initialize(): void {
    if (this.initialized) {
      logger.debug('TOILService already initialized');
      return;
    }
    
    if (this.initializationAttempts >= this.MAX_INIT_ATTEMPTS) {
      logger.error(`Maximum initialization attempts (${this.MAX_INIT_ATTEMPTS}) reached`);
      return;
    }
    
    this.initializationAttempts++;
    
    try {
      logger.debug(`Initializing TOILService (attempt ${this.initializationAttempts})`);
      
      // Initialize the queue manager
      toilQueueManager.initialize();
      
      this.initialized = true;
      this.initializationError = null;
      logger.debug('TOILService initialized successfully');
    } catch (error) {
      logger.error('Error initializing TOILService:', error);
      this.initializationError = error instanceof Error 
        ? error 
        : new Error('Failed to initialize TOIL service: ' + String(error));
      
      // Retry initialization after delay if we haven't exceeded max attempts
      if (this.initializationAttempts < this.MAX_INIT_ATTEMPTS) {
        logger.debug(`Retrying initialization in ${this.INIT_RETRY_DELAY}ms`);
        setTimeout(() => this.initialize(), this.INIT_RETRY_DELAY);
      } else {
        throw this.initializationError;
      }
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
   * Clear all caches - only call when explicitly needed
   */
  public clearCache(): void {
    try {
      logger.debug('Manually clearing all TOIL caches');
      clearSummaryCache(); // Use proper import instead of require
      logger.debug('Cache cleared successfully');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }
  
  /**
   * Reset initialization state for testing or recovery
   */
  public reset(): void {
    this.initialized = false;
    this.initializationError = null;
    this.initializationAttempts = 0;
    logger.debug('TOILService initializer reset');
  }
}
