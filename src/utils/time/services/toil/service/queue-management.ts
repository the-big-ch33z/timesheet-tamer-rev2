
import { toilQueueManager } from "../queue/TOILQueueManager";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOILService-QueueManagement');

/**
 * Provides queue management capabilities for TOIL service
 */
export class TOILServiceQueueManagement {
  /**
   * Get the current queue length
   */
  public getQueueLength(): number {
    return toilQueueManager.getQueueLength();
  }
  
  /**
   * Check if the queue is currently processing
   */
  public isQueueProcessing(): boolean {
    return toilQueueManager.isQueueProcessing();
  }
  
  /**
   * Clear all items from the queue
   */
  public clearQueue(): void {
    logger.debug('Clearing TOIL calculation queue');
    toilQueueManager.clearQueue();
  }
}
