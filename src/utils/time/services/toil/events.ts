
import { createTimeLogger } from '@/utils/time/errors';
import { TOILSummary } from '@/types/toil';

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

export const dispatchTOILUpdate = (summary: TOILSummary) => {
  const event = new CustomEvent('toil:summary-updated', { detail: summary });
  window.dispatchEvent(event);
  logger.debug('TOIL summary update event dispatched');
};
