
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { eventBus } from "@/utils/events/EventBus";
import { TOIL_EVENTS } from "@/utils/events/eventTypes";
import { performSingleCalculation } from "../batch-processing";
import { PendingTOILCalculation } from "../types";

const logger = createTimeLogger('TOILQueueManager');

/**
 * Manages the queue of TOIL calculations
 * Encapsulates the queue state and processing logic
 */
class TOILQueueManager {
  private calculationQueue: PendingTOILCalculation[] = [];
  private isProcessing: boolean = false;
  private recentlyProcessed: Map<string, number> = new Map();
  private readonly RECENT_THRESHOLD_MS: number = 2000; // 2 seconds
  private isInitialized: boolean = false;
  
  constructor() {
    logger.debug('TOILQueueManager initialized');
  }
  
  /**
   * Initialize the queue manager and start processing
   * This method should only be called once the entire system is ready
   */
  public initialize(): void {
    if (this.isInitialized) {
      logger.debug('TOILQueueManager already initialized');
      return;
    }
    
    this.isInitialized = true;
    logger.debug('TOILQueueManager fully initialized, starting queue processing');
    
    // Start processing the queue only when explicitly initialized
    this.processQueue();
  }
  
  /**
   * Check if a date was recently processed for a user
   */
  public hasRecentlyProcessed(userId: string, date: Date): boolean {
    const dateKey = `${userId}-${date.toISOString().slice(0, 10)}`;
    const lastProcessed = this.recentlyProcessed.get(dateKey);
    
    if (!lastProcessed) {
      return false;
    }
    
    return Date.now() - lastProcessed < this.RECENT_THRESHOLD_MS;
  }
  
  /**
   * Clear the recent processing cache
   */
  public clearRecentProcessing(): void {
    this.recentlyProcessed.clear();
    logger.debug('Cleared recently processed cache');
  }
  
  /**
   * Add a calculation task to the queue
   */
  public queueCalculation(calculation: PendingTOILCalculation): void {
    this.calculationQueue.push(calculation);
    logger.debug(`TOIL calculation queued for ${calculation.date.toISOString().slice(0, 10)}, queue length: ${this.calculationQueue.length}`);
    
    // Start processing if not already running and we're initialized
    if (!this.isProcessing && this.isInitialized) {
      this.processQueue();
    }
    
    // Notify that a calculation has been queued
    eventBus.publish(TOIL_EVENTS.CALCULATED, {
      userId: calculation.userId,
      date: calculation.date,
      status: 'queued',
      timestamp: new Date()
    });
  }
  
  /**
   * Process the TOIL calculation queue
   */
  public processQueue(): void {
    if (!this.isInitialized) {
      logger.debug('Queue processing requested but manager not initialized yet');
      return;
    }
    
    if (this.isProcessing || this.calculationQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    logger.debug(`Starting queue processing with ${this.calculationQueue.length} items`);
    
    const processNext = () => {
      if (this.calculationQueue.length === 0) {
        this.isProcessing = false;
        logger.debug('Queue processing complete');
        return;
      }
      
      const calculation = this.calculationQueue.shift()!;
      
      performSingleCalculation(
        calculation.entries,
        calculation.date,
        calculation.userId,
        calculation.workSchedule,
        calculation.holidays
      )
        .then(result => {
          // Mark as recently processed
          const dateKey = `${calculation.userId}-${calculation.date.toISOString().slice(0, 10)}`;
          this.recentlyProcessed.set(dateKey, Date.now());
          
          // Clean up old entries to prevent memory leaks
          if (this.recentlyProcessed.size > 100) {
            const oldestEntries = Array.from(this.recentlyProcessed.entries())
              .sort((a, b) => a[1] - b[1])
              .slice(0, 50);
            
            oldestEntries.forEach(([key]) => this.recentlyProcessed.delete(key));
          }
          
          // Notify of completion
          eventBus.publish(TOIL_EVENTS.CALCULATED, {
            userId: calculation.userId,
            date: calculation.date,
            status: 'completed',
            summary: result,
            timestamp: new Date()
          });
          
          calculation.resolve(result);
          
          // Process next item in queue
          setTimeout(processNext, 0);
        })
        .catch(error => {
          logger.error('Error processing TOIL calculation:', error);
          
          // Notify of error
          eventBus.publish(TOIL_EVENTS.CALCULATED, {
            userId: calculation.userId,
            date: calculation.date,
            status: 'error',
            error: error.message,
            timestamp: new Date()
          });
          
          if (calculation.reject) {
            calculation.reject(error);
          } else {
            calculation.resolve(null);
          }
          
          // Continue processing queue despite error
          setTimeout(processNext, 0);
        });
    };
    
    processNext();
  }
  
  /**
   * Get current queue length (for testing/monitoring)
   */
  public getQueueLength(): number {
    return this.calculationQueue.length;
  }
  
  /**
   * Check if queue is currently processing
   */
  public isQueueProcessing(): boolean {
    return this.isProcessing;
  }
  
  /**
   * Check if queue manager is initialized
   */
  public isInitializedStatus(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Clear the queue (for testing)
   */
  public clearQueue(): void {
    this.calculationQueue = [];
    this.isProcessing = false;
    logger.debug('Queue cleared');
  }
}

// Export a singleton instance
export const toilQueueManager = new TOILQueueManager();

// Export functions that mirror the original API for backward compatibility
export const hasRecentlyProcessed = (userId: string, date: Date): boolean => {
  return toilQueueManager.hasRecentlyProcessed(userId, date);
};

export const clearRecentProcessing = (): void => {
  toilQueueManager.clearRecentProcessing();
};

export const queueTOILCalculation = (calculation: PendingTOILCalculation): void => {
  toilQueueManager.queueCalculation(calculation);
};

export const processTOILQueue = (): void => {
  toilQueueManager.processQueue();
};

// Export the specific type needed for backwards compatibility
export type { PendingTOILCalculation };
