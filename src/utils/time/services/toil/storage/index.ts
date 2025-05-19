
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
  TOILDayInfo
} from './record-management';

// Re-export constants
export * from './constants';

// Re-export core utilities
export {
  safelyParseJSON,
  attemptStorageOperation,
  loadTOILRecords,
  loadTOILUsage,
  getSummaryCacheKey,
  clearSummaryCache,
  clearAllTOILCaches
} from './core';

// Re-export cleanup functions
export {
  cleanupDuplicateTOILRecords
} from './cleanup';
