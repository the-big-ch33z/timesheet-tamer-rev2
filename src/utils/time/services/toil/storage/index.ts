
// Export key functions from queries
export { 
  getUserTOILRecords,
  findTOILRecordsByEntryId,
  deleteTOILRecordByEntryId, 
  getTOILSummary,
  hasTOILForDay,
  hasTOILForMonth
} from './queries';

// Export types correctly
export type { TOILDayInfo } from './queries';

// Export utility functions
export { attemptStorageOperation, safelyParseJSON } from './utils';

// Export constants
export { 
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES,
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY
} from './constants';

console.log('[TOIL-STORAGE] Storage module initialized');
