
import { createTimeLogger } from '@/utils/time/errors';
import { toilService } from '../service/main';
import { 
  deleteTOILRecordsByEntryId, 
  deleteTOILUsageByEntryId,
  loadTOILRecords,
  loadTOILUsage,
  addToDeletedTOILRecords,
  addToDeletedTOILUsage,
  checkAndFixStorageConsistency
} from '../storage';
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { extractEntryId, extractUserId, createStandardTOILEventData } from './utils';

const logger = createTimeLogger('TOIL-EntryEventHandlers');

/**
 * Handler for entry deletion events - now implements two-phase deletion with physical removal
 */
export function handleEntryDeleted(event: any) {
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
