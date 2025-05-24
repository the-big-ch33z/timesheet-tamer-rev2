
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS, TOILEventData } from '@/utils/events/eventTypes';
import { TOILSummary } from '@/types/toil';
import { unifiedTOILEventService } from '@/utils/time/services/toil/unifiedEventService';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('toilEventUtils');

/**
 * Dispatches TOIL calculation start event
 */
export function dispatchCalculationStart(userId: string, date: Date, monthYear: string, source: string = 'useUnifiedTOIL'): void {
  eventBus.publish(TOIL_EVENTS.CALCULATED, {
    userId,
    date: date.toISOString(),
    status: 'starting',
    timestamp: Date.now(),
    source,
    monthYear
  } as TOILEventData);
}

/**
 * Dispatches TOIL calculation completion event
 */
export function dispatchCalculationComplete(
  userId: string, 
  date: Date, 
  monthYear: string, 
  summary: TOILSummary | null,
  source: string = 'useUnifiedTOIL'
): void {
  if (summary && !summary.monthYear) {
    summary.monthYear = monthYear;
  }
  
  if (summary) {
    unifiedTOILEventService.dispatchTOILSummaryEvent(summary);
  }
  
  eventBus.publish(TOIL_EVENTS.CALCULATED, {
    userId,
    date: date.toISOString(),
    status: 'completed',
    summary,
    timestamp: Date.now(),
    source,
    monthYear,
    requiresRefresh: true
  } as TOILEventData);
}

/**
 * Dispatches TOIL calculation error event
 */
export function dispatchCalculationError(
  userId: string, 
  date: Date, 
  monthYear: string, 
  error: unknown,
  source: string = 'useUnifiedTOIL'
): void {
  eventBus.publish(TOIL_EVENTS.CALCULATED, {
    userId,
    date: date.toISOString(),
    status: 'error',
    error: error instanceof Error ? error.message : String(error),
    timestamp: Date.now(),
    source,
    monthYear
  } as TOILEventData);
}

/**
 * Checks if an event is relevant for the given user and month
 */
export function isRelevantToilEvent(
  eventData: any, 
  userId: string, 
  monthYear: string
): boolean {
  return (
    eventData?.userId === userId && (
      eventData?.monthYear === monthYear ||
      eventData?.date?.startsWith(monthYear) ||
      eventData?.requiresRefresh === true
    )
  );
}
