
/**
 * Re-export TOIL storage functionality from individual modules
 */

// Re-export storage operations
export {
  storeTOILRecord,
  deleteUserTOILRecords,
  deleteTOILRecordById,
  deleteTOILRecordsByEntryId,
  storeTOILUsage,
  storeTOILSummary,
  hasTOILForDay,
  cleanupDuplicateTOILUsage
} from './record-management';

// Re-export type definitions 
export type { TOILDayInfo } from './queries';

// Re-export constants
export * from './constants';

// Re-export core utilities
export {
  safelyParseJSON,
  loadTOILRecords,
  loadTOILUsage,
  getSummaryCacheKey,
  clearSummaryCache,
  clearAllTOILCaches,
  getTOILSummary,
  filterRecordsByDate,
  filterRecordsByEntryId
} from './core';

// Re-export utility functions
export { attemptStorageOperation } from './utils';

// Re-export cleanup functions
export {
  cleanupDuplicateTOILRecords
} from './cleanup';
