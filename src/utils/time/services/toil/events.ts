
import { createTimeLogger } from '@/utils/time/errors';
import { TOILSummary } from '@/types/toil';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const logger = createTimeLogger('TOILEvents');

// Custom event to trigger auto-save across components
let lastTriggerTime = 0;

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

// Dispatch TOIL event both through DOM events and the timeEventsService
export const dispatchTOILEvent = (summary: TOILSummary) => {
  // Dispatch old-style DOM event for backward compatibility
  const event = new CustomEvent('toil:summary-updated', { detail: summary });
  window.dispatchEvent(event);
  
  // Also dispatch through the improved event service
  timeEventsService.publish('toil-updated', {
    userId: summary.userId,
    monthYear: summary.monthYear,
    summary
  });
  
  logger.debug('TOIL summary update events dispatched:', summary);
  return true;
};
