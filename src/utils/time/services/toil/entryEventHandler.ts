
import { createTimeLogger } from '@/utils/time/errors';
import { toilService } from './service/main';
import { 
  deleteTOILRecordsByEntryId, 
  deleteTOILUsageByEntryId,
  loadTOILRecords,
  loadTOILUsage,
  addToDeletedTOILRecords,
  addToDeletedTOILUsage,
  checkAndFixStorageConsistency
} from './storage';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS, TOIL_EVENTS } from '@/utils/events/eventTypes';
import { format } from 'date-fns';

const logger = createTimeLogger('TOIL-EntryEventHandler');

/**
 * Stores cleanup functions to prevent memory leaks
 */
let cleanupFunctions: Array<() => void> = [];

/**
 * Utility function to create standardized TOIL event data
 * This ensures all required properties are present in every event
 */
function createStandardTOILEventData(entryId?: string, userId?: string) {
  const now = new Date();
  const monthYear = format(now, 'yyyy-MM');
  const dateStr = format(now, 'yyyy-MM-dd');
  
  return {
    entryId,
    userId,
    timestamp: Date.now(),
    date: dateStr,
    monthYear: monthYear,
    requiresRefresh: true,
    source: 'entryEventHandler',
    status: 'completed'
  };
}

/**
 * Handler for entry deletion events - now implements two-phase deletion with physical removal
 */
function handleEntryDeleted(event: any) {
  try {
    // Extract the entry ID from different event formats
    const entryId = event?.entryId || event?.detail?.entryId || event?.payload?.entryId;
    
    // Extract user ID if available (important for event targeting)
    const userId = event?.userId || event?.detail?.userId || event?.payload?.userId;
    
    if (!entryId) {
      logger.warn('Entry deleted event received without valid entryId', event);
      return;
    }
    
    logger.debug(`Entry deletion detected for entryId: ${entryId}, implementing two-phase TOIL deletion`);
    
    // Find all TOIL records and usage for this entry before deletion
    const affectedRecords = loadTOILRecords().filter(record => record.entryId === entryId);
    const affectedUsage = loadTOILUsage().filter(usage => usage.entryId === entryId);
    
    // Phase 1: Track deletions (mark as deleted)
    const trackDeletions = async () => {
      const recordTrackingPromises = affectedRecords.map(record => 
        addToDeletedTOILRecords(record.id)
      );
      const usageTrackingPromises = affectedUsage.map(usage => 
        addToDeletedTOILUsage(usage.id)
      );
      
      await Promise.all([...recordTrackingPromises, ...usageTrackingPromises]);
      logger.debug(`Phase 1 complete: Tracked ${affectedRecords.length} records and ${affectedUsage.length} usage items as deleted`);
    };
    
    // Phase 2: Physical deletion from storage
    const physicalDeletion = async () => {
      const [deletedAccrualCount, deletedUsageCount] = await Promise.all([
        deleteTOILRecordsByEntryId(entryId),
        deleteTOILUsageByEntryId(entryId)
      ]);
      
      logger.debug(`Phase 2 complete: Physically deleted ${deletedAccrualCount} records and ${deletedUsageCount} usage items`);
      return { deletedAccrualCount, deletedUsageCount };
    };
    
    // Execute two-phase deletion and cleanup
    trackDeletions()
      .then(() => physicalDeletion())
      .then(async ({ deletedAccrualCount, deletedUsageCount }) => {
        const totalDeleted = deletedAccrualCount + deletedUsageCount;
        
        // Phase 3: Check and fix any storage inconsistencies
        const consistencyCheck = await checkAndFixStorageConsistency();
        if (consistencyCheck.recordsFixed > 0 || consistencyCheck.usageFixed > 0) {
          logger.debug(`Consistency check fixed ${consistencyCheck.recordsFixed} records and ${consistencyCheck.usageFixed} usage items`);
        }
        
        logger.info(`Successfully completed two-phase deletion for entry ${entryId}: ${totalDeleted} total items deleted`);
        
        // Clear caches to ensure data consistency
        toilService.clearCache();
        
        // Only dispatch TOIL update events if we actually deleted something
        if (totalDeleted > 0) {
          // Create standardized event data
          const eventData = createStandardTOILEventData(entryId, userId);
          
          // Dispatch an explicit TOIL calculation event to trigger immediate UI updates
          eventBus.publish(TOIL_EVENTS.CALCULATED, eventData, { debounce: 50 });
          
          // Also publish a summary updated event for backward compatibility
          eventBus.publish(TOIL_EVENTS.SUMMARY_UPDATED, eventData, { debounce: 50 });
          
          // Dispatch a DOM event for older components
          if (typeof window !== 'undefined') {
            const domEvent = new CustomEvent('toil:summary-updated', { detail: eventData });
            window.dispatchEvent(domEvent);
          }
          
          logger.debug('TOIL update events dispatched after two-phase deletion');
        }
      })
      .catch(error => {
        logger.error(`Failed to complete two-phase deletion for entry ${entryId}`, error);
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
