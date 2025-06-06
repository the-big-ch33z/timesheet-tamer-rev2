import { TOILSummary } from "@/types/toil";
import { eventBus } from "@/utils/events/EventBus";
import { TOIL_EVENTS, TOILEventData } from "@/utils/events/eventTypes";
import { timeEventsService } from "@/utils/time/events/timeEventsService";
import { toilEventCoordinator } from "./eventCoordinator";
import { createTimeLogger } from "@/utils/time/errors";
import { format } from "date-fns";

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
 * Helper to ensure all required properties are present in TOIL event data
 */
export const ensureStandardTOILEventData = (data: any): TOILEventData => {
  const now = new Date();
  const standardData: TOILEventData = {
    userId: data?.userId || '',
    timestamp: data?.timestamp || Date.now(),
    requiresRefresh: data?.requiresRefresh !== false, // Default to true
    source: data?.source || 'unifiedTOILEventService'
  };
  
  // Add date if missing
  if (!data?.date) {
    standardData.date = format(now, 'yyyy-MM-dd');
  } else {
    standardData.date = data.date;
  }
  
  // Add monthYear if missing (very important for event targeting)
  if (!data?.monthYear) {
    standardData.monthYear = format(now, 'yyyy-MM');
    
    // Try to extract monthYear from date if possible
    if (typeof data?.date === 'string' && data.date.length >= 7) {
      standardData.monthYear = data.date.substring(0, 7);
    }
  } else {
    standardData.monthYear = data.monthYear;
  }
  
  // Copy any other properties from original data
  return { ...data, ...standardData };
};

/**
 * Unified Service for TOIL event handling
 */
class UnifiedTOILEventService {
  /**
   * Helper function to dispatch TOIL summary update events
   * Now uses the event coordinator to prevent cascading
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
      
      // Ensure monthYear is always present (very important!)
      if (!summary.monthYear) {
        logger.warn('TOIL summary missing monthYear, adding it from date or user ID');
        summary.monthYear = new Date().toISOString().substring(0, 7); // YYYY-MM format
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
      
      logger.debug('Dispatching TOIL summary through coordinator:', {
        userId: summary.userId, 
        monthYear: summary.monthYear,
        accrued: summary.accrued,
        used: summary.used,
        remaining: summary.remaining
      });
      
      // Use the event coordinator to batch and deduplicate events
      toilEventCoordinator.queueSummaryUpdate(summary, 'unifiedTOILEventService');
      
      // Keep minimal backward compatibility - only DOM events, no additional EventBus events
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toil:summary-updated', { 
          detail: {
            ...summary,
            timestamp: Date.now(),
            source: 'unifiedTOILEventService'
          }
        });
        window.dispatchEvent(event);
      }
      
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
        let data = customEvent.detail;
        
        // Enhanced data normalization to handle different event formats
        if (!data) {
          data = {};
        }
        
        // Ensure data has standard properties
        data = ensureStandardTOILEventData(data);
        
        // Log if callback provided
        if (onLog) {
          onLog(`TOIL update event received:`, data);
        } else {
          logger.debug(`TOIL update event received:`, data);
        }
        
        // Enhanced relevance check with better fallback behavior
        const isRelevantUser = !userId || data?.userId === userId;
        const isRelevantMonth = !monthYear || 
                               !data.monthYear || 
                               data.monthYear === monthYear ||
                               (data.date && data.date.startsWith(monthYear)) ||
                               (data.monthYears && data.monthYears.includes(monthYear));
        
        // Also consider requiresRefresh flag
        const forceRefresh = !!data?.requiresRefresh;
        
        if (isRelevantUser && (isRelevantMonth || forceRefresh)) {
          if (onLog) {
            onLog(`Valid update for user ${userId} and month ${monthYear || 'any'}`);
          } else {
            logger.debug(`Valid update for user ${userId} and month ${monthYear || 'any'}`);
          }
          
          // If we have accrued data, we can update directly
          if (typeof data.accrued === 'number' && onValidUpdate) {
            const summary: TOILSummary = {
              userId: data.userId || userId,
              monthYear: data.monthYear || monthYear || new Date().toISOString().substring(0, 7),
              accrued: data.accrued,
              used: data.used || 0,
              remaining: data.remaining || (data.accrued - (data.used || 0))
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
              onLog(`No accrued data or force refresh requested, refreshing summary`);
            } else {
              logger.debug(`No accrued data or force refresh requested, refreshing summary`);
            }
            
            onRefresh();
          }
        } else if (onLog) {
          onLog(`Ignoring event - not relevant for this component (user: ${isRelevantUser}, month: ${isRelevantMonth})`);
        }
      } catch (error) {
        logger.error(`Error handling TOIL update event:`, error);
      }
    };
  };

  /**
   * Trigger a TOIL save event with increased debouncing
   * @returns {boolean} Whether the event was triggered
   */
  public triggerTOILSave = () => {
    logger.debug('Dispatching TOIL save event');
    
    // Use EventBus with increased debouncing
    eventBus.publish('toil:save-pending-changes', {}, {
      debounce: 500, // Increased from 300ms
      deduplicate: true
    });
    
    // For backward compatibility, also dispatch the old-style DOM event with debouncing
    if (typeof window !== 'undefined') {
      // Use a simple debounce mechanism for DOM events
      const now = Date.now();
      const lastSave = (window as any)._lastTOILSave || 0;
      
      if (now - lastSave > 500) { // 500ms debounce
        const event = new CustomEvent('toil:save-pending-changes');
        window.dispatchEvent(event);
        (window as any)._lastTOILSave = now;
      }
    }
    
    return true;
  };

  /**
   * Dispatch a TOIL error event with increased debouncing
   * @param {string} errorMessage The error message
   * @param {any} data Additional error data
   * @param {string} userId Optional user ID
   */
  public dispatchTOILErrorEvent = (errorMessage: string, data?: any, userId?: string) => {
    try {
      logger.error(`TOIL Error: ${errorMessage}`, data);
      
      // Create unified error event data
      const errorData = { 
        message: errorMessage, 
        data, 
        userId,
        timestamp: Date.now()
      };
      
      // Dispatch through EventBus with increased debouncing
      eventBus.publish(TOIL_EVENTS.ERROR, errorData, {
        debounce: 1000 // 1 second debounce for errors
      });
      
      // Dispatch through DOM event for backward compatibility (also debounced)
      if (typeof window !== 'undefined') {
        const now = Date.now();
        const lastError = (window as any)._lastTOILError || 0;
        
        if (now - lastError > 1000) { // 1 second debounce
          const event = new CustomEvent('toil:error', { detail: errorData });
          window.dispatchEvent(event);
          (window as any)._lastTOILError = now;
        }
      }
      
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
logger.debug('Unified TOIL Event Service initialized with event coordinator');
