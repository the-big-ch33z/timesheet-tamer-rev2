
import { 
  initializeTOILEntryEventHandlers,
  cleanupTOILEntryEventHandlers,
  setupAutoInitialization
} from './entryEventHandler/initialization';

// Re-export the main functions for backward compatibility
export {
  initializeTOILEntryEventHandlers,
  cleanupTOILEntryEventHandlers
} from './entryEventHandler/initialization';

// Initialize the auto-setup when this module is imported
setupAutoInitialization();
