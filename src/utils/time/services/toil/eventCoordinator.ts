
import { TOILSummary } from '@/types/toil';
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS, TOILEventData } from '@/utils/events/eventTypes';
import { createTimeLogger } from '@/utils/time/errors';
import { format } from 'date-fns';

const logger = createTimeLogger('TOILEventCoordinator');

interface PendingOperation {
  userId: string;
  monthYear: string;
  timestamp: number;
  type: 'calculation' | 'summary_update';
  data?: any;
}

/**
 * Centralized coordinator for TOIL events to prevent cascading and improve performance
 */
class TOILEventCoordinator {
  private pendingOperations = new Map<string, PendingOperation>();
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 500; // 500ms batching window
  private readonly MAX_EVENTS_PER_BATCH = 10;
  private eventHistory: Array<{ key: string; timestamp: number }> = [];
  private readonly DEDUPLICATION_WINDOW = 1000; // 1 second deduplication window

  /**
   * Queue a TOIL calculation with deduplication and batching
   */
  public queueCalculation(userId: string, date: Date, monthYear: string, source: string = 'coordinator'): void {
    const key = `${userId}-${monthYear}`;
    const now = Date.now();
    
    // Check for recent duplicate events
    if (this.isDuplicateEvent(key, now)) {
      logger.debug(`Skipping duplicate calculation for ${key}`);
      return;
    }
    
    this.pendingOperations.set(key, {
      userId,
      monthYear,
      timestamp: now,
      type: 'calculation',
      data: { date: date.toISOString(), source }
    });
    
    this.scheduleFlush();
  }

  /**
   * Queue a TOIL summary update with deduplication and batching
   */
  public queueSummaryUpdate(summary: TOILSummary, source: string = 'coordinator'): void {
    if (!summary?.userId || !summary?.monthYear) {
      logger.warn('Invalid summary provided to queueSummaryUpdate:', summary);
      return;
    }
    
    const key = `${summary.userId}-${summary.monthYear}`;
    const now = Date.now();
    
    // Check for recent duplicate events
    if (this.isDuplicateEvent(key, now)) {
      logger.debug(`Skipping duplicate summary update for ${key}`);
      return;
    }
    
    this.pendingOperations.set(key, {
      userId: summary.userId,
      monthYear: summary.monthYear,
      timestamp: now,
      type: 'summary_update',
      data: { summary, source }
    });
    
    this.scheduleFlush();
  }

  /**
   * Check if this is a duplicate event within the deduplication window
   */
  private isDuplicateEvent(key: string, timestamp: number): boolean {
    // Clean old events from history
    this.eventHistory = this.eventHistory.filter(
      event => timestamp - event.timestamp < this.DEDUPLICATION_WINDOW
    );
    
    // Check if we've seen this key recently
    const isDuplicate = this.eventHistory.some(
      event => event.key === key && timestamp - event.timestamp < this.DEDUPLICATION_WINDOW
    );
    
    if (!isDuplicate) {
      this.eventHistory.push({ key, timestamp });
    }
    
    return isDuplicate;
  }

  /**
   * Schedule a batch flush of pending operations
   */
  private scheduleFlush(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.batchTimer = setTimeout(() => {
      this.flushPendingOperations();
    }, this.BATCH_DELAY);
  }

  /**
   * Flush all pending operations in a single batch
   */
  private flushPendingOperations(): void {
    if (this.pendingOperations.size === 0) {
      return;
    }
    
    const operations = Array.from(this.pendingOperations.values());
    const operationsToProcess = operations.slice(0, this.MAX_EVENTS_PER_BATCH);
    
    logger.debug(`Flushing ${operationsToProcess.length} batched TOIL operations`);
    
    // Group operations by type
    const calculations = operationsToProcess.filter(op => op.type === 'calculation');
    const summaryUpdates = operationsToProcess.filter(op => op.type === 'summary_update');
    
    // Process calculations
    if (calculations.length > 0) {
      this.processBatchedCalculations(calculations);
    }
    
    // Process summary updates
    if (summaryUpdates.length > 0) {
      this.processBatchedSummaryUpdates(summaryUpdates);
    }
    
    // Clear processed operations
    operationsToProcess.forEach(op => {
      const key = `${op.userId}-${op.monthYear}`;
      this.pendingOperations.delete(key);
    });
    
    // If there are more operations, schedule another flush
    if (this.pendingOperations.size > 0) {
      this.scheduleFlush();
    }
    
    this.batchTimer = null;
  }

  /**
   * Process batched calculation operations
   */
  private processBatchedCalculations(calculations: PendingOperation[]): void {
    // Group by user for efficient processing
    const userGroups = calculations.reduce((groups, calc) => {
      if (!groups[calc.userId]) {
        groups[calc.userId] = [];
      }
      groups[calc.userId].push(calc);
      return groups;
    }, {} as Record<string, PendingOperation[]>);
    
    Object.entries(userGroups).forEach(([userId, userCalcs]) => {
      // For each user, emit a single calculation event covering all their months
      const monthYears = userCalcs.map(calc => calc.monthYear);
      const uniqueMonths = [...new Set(monthYears)];
      
      logger.debug(`Emitting batched calculation for user ${userId}, months: ${uniqueMonths.join(', ')}`);
      
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        monthYears: uniqueMonths,
        timestamp: Date.now(),
        source: 'event-coordinator-batch',
        status: 'completed',
        requiresRefresh: true
      } as TOILEventData, { 
        debounce: 100 // Minimal debounce for batched events
      });
    });
  }

  /**
   * Process batched summary update operations
   */
  private processBatchedSummaryUpdates(summaryUpdates: PendingOperation[]): void {
    summaryUpdates.forEach(update => {
      const { summary } = update.data;
      
      logger.debug(`Emitting batched summary update for user ${update.userId}, month ${update.monthYear}`);
      
      // Single consolidated summary update event
      eventBus.publish(TOIL_EVENTS.SUMMARY_UPDATED, {
        ...summary,
        userId: update.userId,
        monthYear: update.monthYear,
        timestamp: Date.now(),
        source: 'event-coordinator-batch',
        requiresRefresh: true
      } as TOILEventData, { 
        debounce: 100 // Minimal debounce for batched events
      });
    });
  }

  /**
   * Force flush all pending operations immediately (for testing/cleanup)
   */
  public flushImmediate(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.flushPendingOperations();
  }

  /**
   * Get current queue size (for monitoring)
   */
  public getQueueSize(): number {
    return this.pendingOperations.size;
  }

  /**
   * Clear all pending operations (for cleanup)
   */
  public clear(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.pendingOperations.clear();
    this.eventHistory = [];
  }
}

// Export singleton instance
export const toilEventCoordinator = new TOILEventCoordinator();
