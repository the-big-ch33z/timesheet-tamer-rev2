
/**
 * Re-export TOIL storage functionality from individual modules
 */

// Re-export storage operations
export {
  storeTOILRecord,
  deleteUserTOILRecords,
  deleteTOILRecordById,
  deleteTOILRecordsByEntryId,
  deleteTOILUsageByEntryId,
  storeTOILUsage,
  storeTOILSummary,
  hasTOILForDay,
  cleanupDuplicateTOILUsage
} from './record-management';

// Re-export deletion tracking
export {
  loadDeletedTOILRecords,
  loadDeletedTOILUsage,
  addToDeletedTOILRecords,
  addToDeletedTOILUsage,
  isTOILRecordDeleted,
  isTOILUsageDeleted,
  clearAllTOILDeletionTracking,
  DELETED_TOIL_RECORDS_KEY,
  DELETED_TOIL_USAGE_KEY
} from './deletion-tracking';

// Re-export type definitions 
export type { TOILDayInfo } from './queries';

// Re-export constants
export * from './constants';

// Re-export core utilities
export {
  safelyParseJSON,
  loadTOILRecords,
  loadTOILUsage,
  loadRawTOILRecords,
  loadRawTOILUsage,
  getSummaryCacheKey,
  clearSummaryCache,
  clearAllTOILCaches,
  getTOILSummary,
  filterRecordsByDate,
  filterRecordsByEntryId,
  checkAndFixStorageConsistency
} from './core';

// Re-export utility functions
export { attemptStorageOperation } from './utils';

// Re-export cleanup functions
export {
  cleanupDuplicateTOILRecords
} from './cleanup';
