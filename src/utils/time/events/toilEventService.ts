
// This file now serves as a re-export module for backward compatibility
import { 
  dispatchTOILSummaryEvent,
  dispatchTOILEvent,
  createTOILUpdateHandler
} from './toil';

// Re-export types with 'export type' for TypeScript isolatedModules
export type { TOILEventType } from './toil';
export type { TOILEvent } from './toil';
export type { TOILEventContextType } from './toil';

// Re-export components and functions
export { 
  TOILEventProvider,
  useTOILEvents
} from './toil';

// Re-export the handler functions
export {
  dispatchTOILSummaryEvent,
  dispatchTOILEvent,
  createTOILUpdateHandler
};
