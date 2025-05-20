
import { createTimeLogger } from '@/utils/time/errors';
import { TOILSummary } from '@/types/toil';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';

const logger = createTimeLogger('TOILEvents');

/**
 * Trigger a TOIL save event with debouncing
 * Now using EventBus which has built-in debouncing support
 * @returns {boolean} Whether the event was triggered
 */
export const triggerTOILSave = () => {
  logger.debug('Dispatching TOIL save event');
  
  // Use EventBus with debouncing option
  eventBus.publish('toil:save-pending-changes', {}, {
    debounce: 300,
    deduplicate: true
  });
  
  // For backward compatibility, also dispatch the old-style DOM event
  const event = new CustomEvent('toil:save-pending-changes');
  window.dispatchEvent(event);
  
  return true;
};

/**
 * Dispatch a TOIL event using the centralized EventBus
 * @param {TOILSummary} summary The TOIL summary to dispatch
 * @returns {boolean} Whether the event was successfully dispatched
 */
export const dispatchTOILEvent = (summary: TOILSummary) => {
  try {
    if (!summary || typeof summary !== 'object') {
      logger.error('Invalid TOIL summary provided to dispatchTOILEvent:', summary);
      return false;
    }
    
    // Validate required fields
    if (!summary.userId) {
      logger.error('TOIL summary missing userId');
      return false;
    }
    
    if (!summary.monthYear) {
      logger.error('TOIL summary missing monthYear');
      return false;
    }
    
    // Validate numeric fields
    if (typeof summary.accrued !== 'number' || 
        typeof summary.used !== 'number' || 
        typeof summary.remaining !== 'number') {
      logger.error('TOIL summary contains non-numeric values:', {
        accrued: summary.accrued,
        used: summary.used,
        remaining: summary.remaining
      });
      // Continue with event dispatch but log error
    }
    
    // Dispatch through the centralized event bus with minimal debounce
    eventBus.publish(TOIL_EVENTS.SUMMARY_UPDATED, summary, { debounce: 10 });
    
    // Also dispatch a calendar refresh event to ensure immediate UI updates
    // Use almost no debounce to ensure it happens right away
    eventBus.publish(TOIL_EVENTS.CALCULATED, {
      userId: summary.userId,
      date: new Date(),
      status: 'completed',
      summary: summary,
      requiresRefresh: true
    }, { debounce: 10 });
    
    // Dispatch old-style DOM event for backward compatibility
    const event = new CustomEvent('toil:summary-updated', { 
      detail: summary 
    });
    window.dispatchEvent(event);
    
    // Also dispatch through the timeEventsService for complete backward compatibility
    timeEventsService.publish('toil-updated', {
      userId: summary.userId,
      monthYear: summary.monthYear,
      summary
    });
    
    logger.debug('TOIL summary update events dispatched:', summary);
    return true;
  } catch (error) {
    logger.error('Error dispatching TOIL event:', error);
    return false;
  }
};

/**
 * Dispatch a TOIL error event
 * @param {string} errorMessage The error message
 * @param {any} data Additional error data
 * @param {string} userId Optional user ID
 */
export const dispatchTOILErrorEvent = (errorMessage: string, data?: any, userId?: string) => {
  try {
    logger.error(`TOIL Error: ${errorMessage}`, data);
    
    // Dispatch through EventBus
    eventBus.publish('toil:error', { 
      message: errorMessage, 
      data, 
      userId,
      timestamp: new Date()
    });
    
    // Dispatch through DOM event
    const event = new CustomEvent('toil:error', { 
      detail: { message: errorMessage, data, userId } 
    });
    window.dispatchEvent(event);
    
    // Also dispatch through the improved event service
    timeEventsService.publish('toil-error' as any, {
      message: errorMessage,
      data,
      userId,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    logger.error('Error dispatching TOIL error event:', error);
    return false;
  }
};
