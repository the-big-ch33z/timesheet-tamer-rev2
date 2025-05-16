import { TOILSummary } from "@/types/toil";
import { eventBus } from "@/utils/events/EventBus";
import { TOIL_EVENTS } from "@/utils/events/eventTypes";
import { createTimeLogger } from "@/utils/time/errors";
import { TOILUpdateHandlerCallbacks } from "./types";

const logger = createTimeLogger('TOILEventHandlers');

/**
 * Helper function to dispatch TOIL summary update events
 * Integrates with legacy event system
 */
export const dispatchTOILSummaryEvent = (summary: TOILSummary) => {
  // Use the central event bus directly
  eventBus.publish(TOIL_EVENTS.SUMMARY_UPDATED, summary);
  logger.debug('TOIL summary update dispatched:', summary);
  return true;
};

/**
 * Factory function that creates a standardized TOIL update event handler
 * This unifies the event handling logic across different components
 * 
 * @param userId The user ID to filter events for
 * @param monthYear Optional month/year to filter events for
 * @param callbacks Object containing callback functions
 * @returns A handler function for TOIL update events
 */
export const createTOILUpdateHandler = (
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

// Export the enhanced dispatch function to replace the original one
export { dispatchTOILSummaryEvent as dispatchTOILEvent };
