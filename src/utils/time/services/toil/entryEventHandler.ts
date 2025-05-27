
import { 
  initializeTOILEntryEventHandlers,
  cleanupTOILEntryEventHandlers,
  setupAutoInitialization
} from './entryEventHandler';

// Re-export the main functions for backward compatibility
export {
  initializeTOILEntryEventHandlers,
  cleanupTOILEntryEventHandlers
} from './entryEventHandler';

// Initialize the auto-setup when this module is imported
setupAutoInitialization();
