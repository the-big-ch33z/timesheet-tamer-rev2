
import { TOILSummary } from "@/types/toil";
import { eventBus } from "@/utils/events/EventBus";
import { TOIL_EVENTS } from "@/utils/events/eventTypes";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('UnifiedTOILEventService');

/**
 * Type definition for TOIL update handler callbacks
 * Used by the factory function to create customized event handlers
 */
export interface TOILUpdateHandlerCallbacks {
  /** Called when a valid TOIL update is received */
  onValidUpdate?: (summary: TOILSummary) => void;
  /** Called when a refresh is needed */
  onRefresh?: () => void;
  /** Called to log information (for debugging) */
  onLog?: (message: string, data?: any) => void;
}

/**
 * Unified Service for TOIL event handling
 * Combines functionality from multiple existing services:
 * - src/utils/time/events/toil/eventHandlers.ts
 * - src/utils/time/services/toil/events.ts
 */
class UnifiedTOILEventService {
  /**
   * Helper function to dispatch TOIL summary update events
   * Integrates with all event systems for backward compatibility
   * @param summary The TOIL summary to dispatch
   * @returns {boolean} Whether the event was successfully dispatched
   */
  public dispatchTOILSummaryEvent = (summary: TOILSummary): boolean => {
    try {
      if (!summary || typeof summary !== 'object') {
        logger.error('Invalid TOIL summary provided to dispatchTOILSummaryEvent:', summary);
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
        logger.warn('TOIL summary contains non-numeric values:', {
          accrued: summary.accrued,
          used: summary.used,
          remaining: summary.remaining
        });
        // Continue despite warning
      }
      
      // 1. Dispatch through the centralized event bus with minimal debounce
      eventBus.publish(TOIL_EVENTS.SUMMARY_UPDATED, summary, { debounce: 10 });
      
      // 2. Also dispatch a calendar refresh event to ensure immediate UI updates
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId: summary.userId,
        date: new Date(),
        status: 'completed',
        summary: summary,
        requiresRefresh: true
      }, { debounce: 10 });
      
      // 3. Dispatch old-style DOM event for backward compatibility
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toil:summary-updated', { 
          detail: summary 
        });
        window.dispatchEvent(event);
      }
      
      // 4. Also dispatch through the timeEventsService for complete backward compatibility
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
   * Alias for dispatchTOILSummaryEvent for backward compatibility
   */
  public dispatchTOILEvent = this.dispatchTOILSummaryEvent;
  
  /**
   * Factory function that creates a standardized TOIL update event handler
   * This unifies the event handling logic across different components
   * 
   * @param userId The user ID to filter events for
   * @param monthYear Optional month/year to filter events for
   * @param callbacks Object containing callback functions
   * @returns A handler function for TOIL update events
   */
  public createTOILUpdateHandler = (
    userId: string,
    monthYear?: string,
    callbacks?: TOILUpdateHandlerCallbacks
  ) => {
    const { onValidUpdate, onRefresh, onLog } = callbacks || {};
    
    // Return the actual event handler function
    return (event: Event) => {
      try {
        // Type guard and conversion
        const customEvent = event as CustomEvent;
        const data = customEvent.detail;
        
        // Log if callback provided
        if (onLog) {
          onLog(`TOIL update event received:`, data);
        } else {
          logger.debug(`TOIL update event received:`, data);
        }
        
        // Check if this event is relevant for this component
        const isRelevantUser = data?.userId === userId;
        const isRelevantMonth = !monthYear || !data.monthYear || data.monthYear === monthYear;
        
        if (isRelevantUser && isRelevantMonth) {
          if (onLog) {
            onLog(`Valid update for current user ${userId} and month ${monthYear || 'any'}`);
          } else {
            logger.debug(`Valid update for current user ${userId} and month ${monthYear || 'any'}`);
          }
          
          // If we have accrued data, we can update directly
          if (typeof data.accrued === 'number' && onValidUpdate) {
            const summary: TOILSummary = {
              userId,
              monthYear: data.monthYear || monthYear || '',
              accrued: data.accrued,
              used: data.used,
              remaining: data.remaining
            };
            
            onValidUpdate(summary);
            
            if (onLog) {
              onLog(`Updated summary from event data`, summary);
            } else {
              logger.debug(`Updated summary from event data`, summary);
            }
          } 
          // Otherwise trigger a refresh
          else if (onRefresh) {
            if (onLog) {
              onLog(`No accrued data, refreshing summary`);
            } else {
              logger.debug(`No accrued data, refreshing summary`);
            }
            
            onRefresh();
          }
        }
      } catch (error) {
        logger.error(`Error handling TOIL update event:`, error);
      }
    };
  };

  /**
   * Trigger a TOIL save event with debouncing
   * @returns {boolean} Whether the event was triggered
   */
  public triggerTOILSave = () => {
    logger.debug('Dispatching TOIL save event');
    
    // Use EventBus with debouncing option
    eventBus.publish('toil:save-pending-changes', {}, {
      debounce: 300,
      deduplicate: true
    });
    
    // For backward compatibility, also dispatch the old-style DOM event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toil:save-pending-changes');
      window.dispatchEvent(event);
    }
    
    return true;
  };

  /**
   * Dispatch a TOIL error event
   * @param {string} errorMessage The error message
   * @param {any} data Additional error data
   * @param {string} userId Optional user ID
   */
  public dispatchTOILErrorEvent = (errorMessage: string, data?: any, userId?: string) => {
    try {
      logger.error(`TOIL Error: ${errorMessage}`, data);
      
      // Dispatch through EventBus
      eventBus.publish(TOIL_EVENTS.ERROR, { 
        message: errorMessage, 
        data, 
        userId,
        timestamp: new Date()
      });
      
      // Dispatch through DOM event for backward compatibility
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toil:error', { 
          detail: { message: errorMessage, data, userId } 
        });
        window.dispatchEvent(event);
      }
      
      // Also dispatch through the timeEventsService for backward compatibility
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
}

// Export a singleton instance
export const unifiedTOILEventService = new UnifiedTOILEventService();

// Export individual functions for easier importing
export const createTOILUpdateHandler = unifiedTOILEventService.createTOILUpdateHandler;
export const dispatchTOILEvent = unifiedTOILEventService.dispatchTOILEvent;
export const dispatchTOILSummaryEvent = unifiedTOILEventService.dispatchTOILSummaryEvent;

// Initialize the service when this module is imported
logger.debug('Unified TOIL Event Service initialized');
