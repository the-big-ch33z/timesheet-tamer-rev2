
/**
 * Time Entry Operations
 * 
 * This module consolidates all time entry operations into a single file for easier imports.
 * It is deprecated and will be removed in favor of the unified service.
 */

// Export all operation classes
export { CreateOperations } from './create-operations';
export { UpdateOperations } from './update-operations';
export { DeleteOperations } from './delete-operations';
export { TimeEntryOperations } from '../time-entry-operations';

// Export types
export type { TimeEntryBaseOperations, TimeEntryOperationsConfig } from './types';

// Export utility functions
export { dispatchEntryEvent, dispatchErrorEvent } from './event-utils';

// Add deprecation notice
if (process.env.NODE_ENV !== 'test') {
  console.warn(
    'The operations modules in src/utils/time/services/operations are deprecated.\n' +
    'Please use the UnifiedTimeEntryService class instead.\n' +
    'These files will be removed in a future version.'
  );
}
