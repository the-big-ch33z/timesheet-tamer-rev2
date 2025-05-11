
// Export key functions and types from all storage sub-modules

// Export constants
export { 
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES,
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY
} from './constants';

// Export utilities
export {
  attemptStorageOperation,
  safelyParseJSON
} from './utils';

// Export core functions
export {
  clearSummaryCache,
  clearAllTOILCaches
} from './core';

// Export record management functions
export {
  loadTOILRecords,
  loadTOILUsage,
  storeTOILRecord,
  storeTOILUsage
} from './record-management';

// Export query functions
export {
  getUserTOILRecords,
  findTOILRecordsByEntryId,
  deleteTOILRecordByEntryId,
  getTOILSummary,
  hasTOILForDay,
  hasTOILForMonth
} from './queries';

// Export cleanup functions
export {
  cleanupDuplicateTOILRecords,
  cleanupDuplicateTOILUsage,
  clearTOILStorageForMonth
} from './cleanup';

// Export TOILDayInfo interface
export type { TOILDayInfo } from './queries';

console.log('[TOIL-STORAGE] Storage module index initialized');
