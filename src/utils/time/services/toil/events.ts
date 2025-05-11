
import { createTimeLogger } from '@/utils/time/errors';
import { TOILSummary } from '@/types/toil';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const logger = createTimeLogger('TOILEvents');

// Custom event to trigger auto-save across components
let lastTriggerTime = 0;

/**
 * Trigger a TOIL save event with debouncing
 * @returns {boolean} Whether the event was triggered
 */
export const triggerTOILSave = () => {
  // Prevent multiple triggers in quick succession
  const now = Date.now();
  if (now - lastTriggerTime < 300) {
    logger.debug('Skipping duplicate TOIL save event trigger');
    return false;
  }
  
  logger.debug('Dispatching TOIL save event');
  const event = new CustomEvent('toil:save-pending-changes');
  window.dispatchEvent(event);
  
  lastTriggerTime = now;
  return true;
};

/**
 * Dispatch a TOIL event with enhanced error handling
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
    
    // Dispatch old-style DOM event for backward compatibility
    const event = new CustomEvent('toil:summary-updated', { 
      detail: summary 
    });
    window.dispatchEvent(event);
    
    // Also dispatch through the improved event service
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
