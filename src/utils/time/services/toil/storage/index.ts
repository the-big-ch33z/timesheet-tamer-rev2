
// Export key functions and types from all storage sub-modules

// Export constants
export { 
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES,
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  TOIL_THRESHOLDS_KEY,
  DEFAULT_THRESHOLDS,
} from './constants';

// Export core utilities
export {
  attemptStorageOperation,
  safelyParseJSON,
  loadTOILRecords,
  loadTOILUsage,
  filterRecordsByMonth,
  filterRecordsByDate,
  clearSummaryCache,
  clearAllTOILCaches,
  getSummaryCacheKey
} from './core';

// Export record management functions - via the record management re-export file
export {
  storeTOILRecord,
  storeTOILUsage,
  storeTOILSummary,
  deleteUserTOILRecords,
  deleteTOILRecordById,
  deleteTOILRecordsByEntryId
} from './record-management';

// Export individual operations directly for specialized imports
export * from './record-operations';
export * from './usage-operations';
export * from './summary-operations';

// Export query functions
export {
  getUserTOILRecords,
  findTOILRecordsByEntryId,
  deleteTOILRecordByEntryId, // Deprecated but still exported
  getTOILSummary,
  hasTOILForDay,
  hasTOILForMonth
} from './queries';

// Export cleanup functions
export {
  cleanupDuplicateTOILRecords,
  cleanupDuplicateTOILUsage,
  clearTOILStorageForMonth,
  batchCleanupTOILData
} from './cleanup';

console.log('[TOIL-STORAGE] Storage module index initialized with refactored operations');
