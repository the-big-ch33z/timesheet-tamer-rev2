
// Re-export from the unified event service module
export { 
  unifiedTOILEventService as toilEventService
} from '@/utils/time/services/toil/unifiedEventService';

// Also re-export these specific functions for backward compatibility
export { 
  createTOILUpdateHandler,
  dispatchTOILEvent, 
  dispatchTOILSummaryEvent 
} from '@/utils/time/services/toil/unifiedEventService';
