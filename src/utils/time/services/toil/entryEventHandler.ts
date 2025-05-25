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
let isInitialized = false;
let initializationTimeout: ReturnType<typeof setTimeout> | null = null;

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
 * Comprehensive entry ID extraction from any event format
 * Updated to handle the standardized event format from unified service
 */
function extractEntryId(event: any): string | null {
  console.log('[TOIL-EventHandler] Raw event received:', {
    type: typeof event,
    keys: Object.keys(event || {}),
    event: event
  });

  // Primary: Direct entryId property (standardized format)
  if (event?.entryId) {
    console.log('[TOIL-EventHandler] Found entryId directly:', event.entryId);
    return event.entryId;
  }

  // Secondary: DOM event detail format
  if (event?.detail?.entryId) {
    console.log('[TOIL-EventHandler] Found entryId in detail:', event.detail.entryId);
    return event.detail.entryId;
  }

  // Tertiary: Custom event payload format
  if (event?.payload?.entryId) {
    console.log('[TOIL-EventHandler] Found entryId in payload:', event.payload.entryId);
    return event.payload.entryId;
  }

  // Legacy formats for backward compatibility
  if (event?.entry?.id) {
    console.log('[TOIL-EventHandler] Found entryId in entry.id:', event.entry.id);
    return event.entry.id;
  }

  if (event?.id && typeof event.id === 'string') {
    console.log('[TOIL-EventHandler] Found entryId as direct id:', event.id);
    return event.id;
  }

  // Check if the whole event is just the entry ID string
  if (typeof event === 'string' && event.length > 0) {
    console.log('[TOIL-EventHandler] Event itself is entryId string:', event);
    return event;
  }

  console.warn('[TOIL-EventHandler] Could not extract entryId from event:', event);
  return null;
}

/**
 * Extract user ID from event (similar comprehensive approach)
 */
function extractUserId(event: any): string | null {
  return event?.userId || 
         event?.detail?.userId || 
         event?.payload?.userId || 
         event?.entry?.userId ||
         event?.data?.userId ||
         event?.data?.entry?.userId ||
         event?.timeEntry?.userId ||
         event?.target?.userId ||
         null;
}

/**
 * Handler for entry deletion events - now implements two-phase deletion with physical removal
 */
function handleEntryDeleted(event: any) {
  try {
    console.log('[TOIL-EventHandler] ==> Entry deletion event received');
    console.log('[TOIL-EventHandler] Event structure analysis:', {
      eventType: typeof event,
      hasDetail: !!event?.detail,
      hasPayload: !!event?.payload,
      hasEntry: !!event?.entry,
      hasData: !!event?.data,
      directKeys: event ? Object.keys(event) : [],
      fullEvent: event
    });

    // Extract the entry ID using comprehensive extraction
    const entryId = extractEntryId(event);
    
    // Extract user ID if available (important for event targeting)
    const userId = extractUserId(event);
    
    if (!entryId) {
      console.error('[TOIL-EventHandler] ❌ Entry deleted event received without valid entryId');
      console.log('[TOIL-EventHandler] Available event properties:', event ? Object.keys(event) : 'null/undefined');
      return;
    }
    
    console.log('[TOIL-EventHandler] ✅ Successfully extracted entryId:', entryId);
    if (userId) {
      console.log('[TOIL-EventHandler] ✅ Successfully extracted userId:', userId);
    }
    
    logger.debug(`Entry deletion detected for entryId: ${entryId}, implementing two-phase TOIL deletion`);
    
    // Find all TOIL records and usage for this entry before deletion
    const affectedRecords = loadTOILRecords().filter(record => record.entryId === entryId);
    const affectedUsage = loadTOILUsage().filter(usage => usage.entryId === entryId);
    
    console.log('[TOIL-EventHandler] Found TOIL data to delete:', {
      entryId,
      recordsCount: affectedRecords.length,
      usageCount: affectedUsage.length,
      records: affectedRecords.map(r => ({ id: r.id, hours: r.hours })),
      usage: affectedUsage.map(u => ({ id: u.id, hours: u.hours }))
    });
    
    // Phase 1: Track deletions (mark as deleted)
    const trackDeletions = async () => {
      const recordTrackingPromises = affectedRecords.map(record => 
        addToDeletedTOILRecords(record.id)
      );
      const usageTrackingPromises = affectedUsage.map(usage => 
        addToDeletedTOILUsage(usage.id)
      );
      
      await Promise.all([...recordTrackingPromises, ...usageTrackingPromises]);
      console.log('[TOIL-EventHandler] Phase 1 complete: Tracked as deleted');
      logger.debug(`Phase 1 complete: Tracked ${affectedRecords.length} records and ${affectedUsage.length} usage items as deleted`);
    };
    
    // Phase 2: Physical deletion from storage
    const physicalDeletion = async () => {
      const [deletedAccrualCount, deletedUsageCount] = await Promise.all([
        deleteTOILRecordsByEntryId(entryId),
        deleteTOILUsageByEntryId(entryId)
      ]);
      
      console.log('[TOIL-EventHandler] Phase 2 complete: Physical deletion done', {
        deletedAccrualCount,
        deletedUsageCount
      });
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
        
        console.log('[TOIL-EventHandler] ✅ Two-phase deletion completed successfully', {
          entryId,
          totalDeleted,
          consistencyFixed: consistencyCheck.recordsFixed + consistencyCheck.usageFixed
        });
        
        logger.info(`Successfully completed two-phase deletion for entry ${entryId}: ${totalDeleted} total items deleted`);
        
        // Clear caches to ensure data consistency
        toilService.clearCache();
        
        // Only dispatch TOIL update events if we actually deleted something
        if (totalDeleted > 0) {
          // Create standardized event data
          const eventData = createStandardTOILEventData(entryId, userId);
          
          console.log('[TOIL-EventHandler] Dispatching TOIL update events after deletion:', eventData);
          
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
        console.error('[TOIL-EventHandler] ❌ Failed to complete two-phase deletion for entry', entryId, error);
        logger.error(`Failed to complete two-phase deletion for entry ${entryId}`, error);
      });
  } catch (error) {
    console.error('[TOIL-EventHandler] ❌ Error handling entry deleted event', error);
    logger.error('Error handling entry deleted event', error);
  }
}

/**
 * Check if services are ready before initializing handlers
 */
function checkServicesReady(): boolean {
  // Check if the unified service is available and initialized
  try {
    const unifiedService = require('@/utils/time/services').unifiedTimeEntryService;
    if (!unifiedService) {
      console.log('[TOIL-EventHandler] Unified service not yet available');
      return false;
    }
    
    // Additional checks can be added here for other required services
    console.log('[TOIL-EventHandler] Services are ready for handler initialization');
    return true;
  } catch (error) {
    console.log('[TOIL-EventHandler] Services not ready:', error);
    return false;
  }
}

/**
 * Initializes all event listeners for TOIL-entry interactions with proper dependency checking
 * Returns a cleanup function to remove all listeners
 */
export function initializeTOILEntryEventHandlers(): () => void {
  if (isInitialized) {
    logger.debug('TOIL entry event handlers already initialized');
    return cleanupTOILEntryEventHandlers;
  }
  
  // Check if services are ready
  if (!checkServicesReady()) {
    logger.debug('Services not ready, delaying handler initialization');
    
    // Clear any existing timeout
    if (initializationTimeout) {
      clearTimeout(initializationTimeout);
    }
    
    // Retry initialization after services have had time to load
    initializationTimeout = setTimeout(() => {
      console.log('[TOIL-EventHandler] Retrying handler initialization after service startup delay');
      initializeTOILEntryEventHandlers();
    }, 1000); // Give services 1 second to initialize
    
    return () => {
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
        initializationTimeout = null;
      }
    };
  }
  
  logger.debug('Initializing TOIL entry event handlers');
  console.log('[TOIL-EventHandler] Initializing handlers with services ready');
  
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
  
  isInitialized = true;
  logger.debug('TOIL entry event handlers initialized successfully');
  console.log('[TOIL-EventHandler] Handler initialization complete');
  
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
  
  // Reset the cleanup functions array and state
  cleanupFunctions = [];
  isInitialized = false;
  
  // Clear any pending initialization timeout
  if (initializationTimeout) {
    clearTimeout(initializationTimeout);
    initializationTimeout = null;
  }
}

// Modified auto-initialization to use proper sequencing
if (typeof window !== 'undefined') {
  // Wait for DOM and initial scripts to load before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeTOILEntryEventHandlers, 100);
    });
  } else {
    // Document already loaded, initialize with a small delay to ensure services are ready
    setTimeout(initializeTOILEntryEventHandlers, 100);
  }
}
