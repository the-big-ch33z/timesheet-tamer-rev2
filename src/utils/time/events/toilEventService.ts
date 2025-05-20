
// Re-export from the unified event service module
export { 
  unifiedTOILEventService as toilEventService,
  createTOILUpdateHandler,
  dispatchTOILEvent, 
  dispatchTOILSummaryEvent 
} from '@/utils/time/services/toil/unifiedEventService';

// Extract specific functions for direct export (for backward compatibility)
import { unifiedTOILEventService } from '@/utils/time/services/toil/unifiedEventService';

export const createTOILUpdateHandler = unifiedTOILEventService.createTOILUpdateHandler;
export const dispatchTOILEvent = unifiedTOILEventService.dispatchTOILEvent;
export const dispatchTOILSummaryEvent = unifiedTOILEventService.dispatchTOILSummaryEvent;
