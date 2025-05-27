
import { createTimeLogger } from '@/utils/time/errors';
import { unifiedTimeEntryService } from '@/utils/time/services';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { eventBus } from '@/utils/events/EventBus';
import { TIME_ENTRY_EVENTS } from '@/utils/events/eventTypes';
import { handleEntryDeleted } from './handlers';

const logger = createTimeLogger('TOIL-EntryEventInitialization');

/**
 * Stores cleanup functions to prevent memory leaks
 */
let cleanupFunctions: Array<() => void> = [];
let isInitialized = false;
let initializationTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Check if services are ready before initializing handlers
 */
function checkServicesReady(): boolean {
  // Check if the unified service is available and initialized
  try {
    if (!unifiedTimeEntryService) {
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

// Auto-initialization logic
export function setupAutoInitialization(): void {
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
}
