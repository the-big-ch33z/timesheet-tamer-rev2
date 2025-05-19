
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { format } from "date-fns";

const logger = createTimeLogger('TOIL-Queue');

// Queue for TOIL calculations
export interface TOILCalculationQueueItem {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule: WorkSchedule;
  holidays: Holiday[];
  resolve: (summary: TOILSummary | null) => void;
}

let calculationQueue: TOILCalculationQueueItem[] = [];
let isProcessingQueue = false;

/**
 * Add a TOIL calculation to the queue
 */
export function queueTOILCalculation(item: TOILCalculationQueueItem): void {
  // Add the item to the queue
  calculationQueue.push(item);
  logger.debug(`Added TOIL calculation to queue for ${item.userId}, ${format(item.date, 'yyyy-MM-dd')}`);
  
  // Start processing the queue if it's not already being processed
  if (!isProcessingQueue) {
    processQueue();
  }
}

/**
 * Process the queue of TOIL calculations
 */
async function processQueue(): Promise<void> {
  if (calculationQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }
  
  isProcessingQueue = true;
  
  try {
    // Get the next item from the queue
    const item = calculationQueue.shift();
    if (!item) {
      isProcessingQueue = false;
      return;
    }
    
    logger.debug(`Processing TOIL calculation for ${item.userId}, ${format(item.date, 'yyyy-MM-dd')}`);
    
    // Call the TOIL service directly - this will be handled by the caller's implementation
    try {
      // This is a placeholder - the actual calculation happens in the TOILServiceCalculation class
      // The service instance passes the resolve callback to be called when calculation is complete
      item.resolve(null);
    } catch (error) {
      logger.error(`Error processing TOIL calculation for ${item.userId}:`, error);
      item.resolve(null);
    }
  } catch (error) {
    logger.error('Error processing TOIL queue:', error);
  } finally {
    // Continue processing the queue
    setTimeout(processQueue, 10);
  }
}

/**
 * Get the length of the queue
 */
export function getQueueLength(): number {
  return calculationQueue.length;
}

/**
 * Check if the queue is currently being processed
 */
export function isQueueProcessing(): boolean {
  return isProcessingQueue;
}

/**
 * Clear the queue
 */
export function clearQueue(): void {
  calculationQueue = [];
  logger.debug('TOIL calculation queue cleared');
}
