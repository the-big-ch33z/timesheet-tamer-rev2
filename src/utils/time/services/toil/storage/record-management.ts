
/**
 * This file re-exports all record management functions from individual operation files
 * To maintain a clean structure while providing a unified API
 */

// Re-export record operations
export { 
  storeTOILRecord,
  deleteUserTOILRecords,
  deleteTOILRecordById,
  deleteTOILRecordsByEntryId
} from './record-operations';

// Re-export usage operations
export {
  storeTOILUsage,
  cleanupDuplicateTOILUsage,
  deleteTOILUsageByEntryId
} from './usage-operations';

// Re-export summary operations
export {
  storeTOILSummary 
} from './summary-operations';

// Re-export query operations
export type { TOILDayInfo } from './queries';
export {
  hasTOILForDay
} from './queries';

// Re-export deletion tracking operations
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
