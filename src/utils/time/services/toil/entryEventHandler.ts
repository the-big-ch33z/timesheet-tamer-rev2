
import { createTimeLogger } from '@/utils/time/errors';
import { toilService } from './service/main';
import { deleteTOILRecordsByEntryId } from './storage';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS } from '@/utils/events/eventTypes';

const logger = createTimeLogger('TOIL-EntryEventHandler');

/**
 * Stores cleanup functions to prevent memory leaks
 */
let cleanupFunctions: Array<() => void> = [];

/**
 * Handler for entry deletion events - cleans up associated TOIL records
 */
function handleEntryDeleted(event: any) {
  try {
    // Extract the entry ID from different event formats
    const entryId = event?.entryId || event?.detail?.entryId || event?.payload?.entryId;
    
    if (!entryId) {
      logger.warn('Entry deleted event received without valid entryId', event);
      return;
    }
    
    logger.debug(`Entry deletion detected for entryId: ${entryId}, cleaning up TOIL records`);
    
    // Delete associated TOIL records
    deleteTOILRecordsByEntryId(entryId)
      .then(deletedCount => {
        logger.info(`Successfully deleted ${deletedCount} TOIL records for entry ${entryId}`);
        
        // Clear caches to ensure data consistency
        toilService.clearCache();
      })
      .catch(error => {
        logger.error(`Failed to delete TOIL records for entry ${entryId}`, error);
      });
  } catch (error) {
    logger.error('Error handling entry deleted event', error);
  }
}

/**
 * Initializes all event listeners for TOIL-entry interactions
 * Returns a cleanup function to remove all listeners
 */
export function initializeTOILEntryEventHandlers(): () => void {
  logger.debug('Initializing TOIL entry event handlers');
  
  // Clean up any existing handlers first
  cleanupTOILEntryEventHandlers();
  
  // Listen for entry deleted events from timeEventsService
  const timeEventsUnsubscribe = timeEventsService.subscribe('entry-deleted', handleEntryDeleted);
  cleanupFunctions.push(timeEventsUnsubscribe.unsubscribe);
  
  // Listen for entry deleted events from the eventBus
  const eventBusUnsubscribe = eventBus.subscribe(TIME_ENTRY_EVENTS.DELETED, handleEntryDeleted);
  cleanupFunctions.push(eventBusUnsubscribe);
  
  // Listen for legacy DOM events (for backward compatibility)
  const handleDomEvent = (e: CustomEvent) => handleEntryDeleted(e);
  window.addEventListener('timesheet:entry-deleted', handleDomEvent as EventListener);
  cleanupFunctions.push(() => window.removeEventListener('timesheet:entry-deleted', handleDomEvent as EventListener));
  
  logger.debug('TOIL entry event handlers initialized');
  
  // Return a function that can be called to clean up all listeners
  return cleanupTOILEntryEventHandlers;
}

/**
 * Removes all event listeners to prevent memory leaks
 */
export function cleanupTOILEntryEventHandlers(): void {
  logger.debug(`Cleaning up ${cleanupFunctions.length} TOIL entry event handlers`);
  
  // Execute all cleanup functions
  cleanupFunctions.forEach(cleanup => {
    try {
      cleanup();
    } catch (error) {
      logger.error('Error cleaning up TOIL entry event handler', error);
    }
  });
  
  // Reset the cleanup functions array
  cleanupFunctions = [];
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  initializeTOILEntryEventHandlers();
}
