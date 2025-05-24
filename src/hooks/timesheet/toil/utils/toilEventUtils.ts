
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS, TOILEventData } from '@/utils/events/eventTypes';
import { TOILSummary } from '@/types/toil';
import { toilEventCoordinator } from '@/utils/time/services/toil/eventCoordinator';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('toilEventUtils');

/**
 * Dispatches TOIL calculation start event through the coordinator
 */
export function dispatchCalculationStart(userId: string, date: Date, monthYear: string, source: string = 'useUnifiedTOIL'): void {
  logger.debug(`Queuing calculation start for ${userId} in ${monthYear}`);
  toilEventCoordinator.queueCalculation(userId, date, monthYear, source);
}

/**
 * Dispatches TOIL calculation completion event through the coordinator
 */
export function dispatchCalculationComplete(
  userId: string, 
  date: Date, 
  monthYear: string, 
  summary: TOILSummary | null,
  source: string = 'useUnifiedTOIL'
): void {
  logger.debug(`Calculation complete for ${userId} in ${monthYear}, queuing summary update`);
  
  if (summary) {
    // Ensure summary has required fields
    if (!summary.monthYear) {
      summary.monthYear = monthYear;
    }
    
    // Queue through coordinator instead of multiple direct dispatches
    toilEventCoordinator.queueSummaryUpdate(summary, source);
  }
}

/**
 * Dispatches TOIL calculation error event with reduced frequency
 */
export function dispatchCalculationError(
  userId: string, 
  date: Date, 
  monthYear: string, 
  error: unknown,
  source: string = 'useUnifiedTOIL'
): void {
  // Error events are important and shouldn't be batched, but should be debounced
  eventBus.publish(TOIL_EVENTS.ERROR, {
    userId,
    date: date.toISOString(),
    status: 'error',
    error: error instanceof Error ? error.message : String(error),
    timestamp: Date.now(),
    source,
    monthYear
  } as TOILEventData, {
    debounce: 1000 // 1 second debounce for errors
  });
}

/**
 * Checks if an event is relevant for the given user and month
 */
export function isRelevantToilEvent(
  eventData: any, 
  userId: string, 
  monthYear: string
): boolean {
  if (!eventData?.userId || eventData.userId !== userId) {
    return false;
  }
  
  // Check for explicit refresh flag
  if (eventData?.requiresRefresh === true) {
    return true;
  }
  
  // Check month relevance
  return (
    eventData?.monthYear === monthYear ||
    eventData?.date?.startsWith(monthYear) ||
    (eventData?.monthYears && eventData.monthYears.includes(monthYear))
  );
}

/**
 * Force flush pending events (useful for cleanup/testing)
 */
export function flushPendingEvents(): void {
  toilEventCoordinator.flushImmediate();
}

/**
 * Get coordinator queue size for monitoring
 */
export function getEventQueueSize(): number {
  return toilEventCoordinator.getQueueSize();
}
